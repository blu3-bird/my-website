// typingNew.js
// What this file does:
// - Shows only 3 lyric lines at a time, and advances one line at a time.
// - Tracks time and live WPM (gross) as the user types.
// - On Submit (or when finished), freezes results: WPM, Time, Accuracy.
// - Reveals a "Review mistakes" button that opens a modal with a detailed diff.
//   Diff is per-line, side-by-side (Target vs You typed), with highlighted:
//   - substitutions (wrong letters),
//   - deletions (missed words/chars),
//   - insertions (extra typed words/chars).

document.addEventListener('DOMContentLoaded', () => {
  // -----------------------
  // 1) Grab DOM elements
  // -----------------------
  const lyricsDataElement = document.getElementById('lyrics-data');
  const lyricsDisplay = document.getElementById('lyrics-display');
  const typingBox = document.getElementById('typing-box');

  const resultsEl = document.getElementById('results');
  const wpmSpan = document.getElementById('wpm');
  const accuracySpan = document.getElementById('accuracy');
  const timeSpan = document.getElementById('time-taken');

  const submitBtn = document.getElementById('submit-btn');
  const resetBtn = document.getElementById('reset-btn');
  const reviewBtn = document.getElementById('review-btn');

  // Review modal pieces
  const reviewBackdrop = document.getElementById('review-backdrop');
  const reviewModal = document.getElementById('review-modal');
  const reviewCloseBtn = document.getElementById('review-close');
  const diffContainer = document.getElementById('diff-container');
  const prevMistakeBtn = document.getElementById('prev-mistake');
  const nextMistakeBtn = document.getElementById('next-mistake');
  const toggleOnlyMistakesBtn = document.getElementById('toggle-only-mistakes');

  // -----------------------
  // 2) Prepare data/state
  // -----------------------
  // Normalize lyrics text (also defensively strip a stray ">" if it snuck into the HTML)
  const fullLyricsRaw = (lyricsDataElement ? lyricsDataElement.textContent : '') || '';
  const fullLyrics = fullLyricsRaw.replace(/\r/g, '').replace(/>\s*$/, '');
  const lyricsLines = fullLyrics ? fullLyrics.split('\n') : [];

  // Typing view state
  let currentLineIndex = 0;
  const linesToDisplay = 3; // current + next two
  const typedLines = [];    // we store exactly what was typed for each completed line

  // Timing + live WPM state
  let startedAt = null;     // first keystroke time
  let endedAt = null;       // when user submits/finishes
  let wpmTimer = null;      // interval id for live WPM updates

  // Finalization/review state
  let finalized = false;
  let finalTypedText = '';     // snapshot of everything user typed on submit/finish
  let onlyMistakes = false;    // modal toggle
  let mistakeAnchors = [];     // list of mistake elements in modal
  let currentMistakeIdx = -1;  // which mistake is "active"/scrolled-to

  // -----------------------
  // 3) Small helpers
  // -----------------------
  const rtrim = (str) => str.replace(/\s+$/, '');

  function pad2(n) { return String(n).padStart(2, '0'); }
  function formatDuration(ms) {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${pad2(sec)}`;
  }

  function getElapsedMs() {
    if (!startedAt) return 0;             // never started typing
    const end = endedAt || Date.now();    // if not ended, measure up to now
    return Math.max(0, end - startedAt);
  }

  function getTypedSnapshot(includeCurrent = true) {
    // Join all completed lines + the current box (if requested)
    const parts = [];
    for (let i = 0; i < typedLines.length; i++) parts.push(typedLines[i] ?? '');
    if (includeCurrent && currentLineIndex < lyricsLines.length) {
      parts.push(typingBox.value);
    }
    return parts.join('\n');
  }

  function computeGrossWpm(charCount, ms) {
    const minutes = ms / 60000;
    if (minutes <= 0) return 0;
    return charCount / 5 / minutes;
  }

  // -----------------------
  // 4) Render the 3-line view
  // -----------------------
  function updateLyricsDisplay() {
    lyricsDisplay.innerHTML = '';

    for (let i = 0; i < linesToDisplay; i++) {
      const lineIndex = currentLineIndex + i;
      if (lineIndex < lyricsLines.length) {
        const p = document.createElement('p');
        p.textContent = lyricsLines[lineIndex];
        p.className = i === 0 ? 'current-line' : 'next-line';
        lyricsDisplay.appendChild(p);
      }
    }

    const currentLineEl = lyricsDisplay.querySelector('.current-line');
    if (currentLineEl) {
      currentLineEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // -----------------------
  // 5) Live WPM timer
  // -----------------------
  function ensureTimerStarted() {
    if (!startedAt) {
      startedAt = Date.now();
      startLiveWpm();
    }
  }
  function startLiveWpm() {
    if (wpmTimer) return;
    updateLiveWpm(); // show immediately
    wpmTimer = setInterval(updateLiveWpm, 250);
  }
  function stopLiveWpm() {
    if (wpmTimer) {
      clearInterval(wpmTimer);
      wpmTimer = null;
    }
  }
  function updateLiveWpm() {
    if (!wpmSpan) return;
    const chars = getTypedSnapshot(true).replace(/\n/g, '').length; // don't count auto newlines
    const ms = getElapsedMs();
    const wpm = computeGrossWpm(chars, ms);
    wpmSpan.textContent = Math.round(wpm);
  }

  // -----------------------
  // 6) Advance line logic
  //     (progress decoupled from correctness; we move on based on length or Enter)
  // -----------------------
  function advanceLine() {
    // Save what was typed for this line before moving on
    typedLines[currentLineIndex] = typingBox.value;

    currentLineIndex++;
    typingBox.value = '';

    if (currentLineIndex >= lyricsLines.length) {
      updateLyricsDisplay();
      finalizeResults('finished');
      return;
    }

    updateLyricsDisplay();
  }

  // -----------------------
  // 7) Finalization (submit/finish) + accuracy
  // -----------------------
  // Character-level Levenshtein distance (for final accuracy)
  function levenshteinDistance(a, b) {
    const alen = a.length, blen = b.length;
    if (alen === 0) return blen;
    if (blen === 0) return alen;

    const prev = new Array(blen + 1);
    const curr = new Array(blen + 1);
    for (let j = 0; j <= blen; j++) prev[j] = j;

    for (let i = 1; i <= alen; i++) {
      curr[0] = i;
      const ai = a.charCodeAt(i - 1);
      for (let j = 1; j <= blen; j++) {
        const cost = ai === b.charCodeAt(j - 1) ? 0 : 1;
        const del = prev[j] + 1;
        const ins = curr[j - 1] + 1;
        const sub = prev[j - 1] + cost;
        curr[j] = Math.min(del, ins, sub);
      }
      // copy curr -> prev
      for (let j = 0; j <= blen; j++) prev[j] = curr[j];
    }
    return prev[blen];
  }

  function finalizeResults(reason = 'submit') {
    if (finalized) return; // don't double-finalize
    finalized = true;

    // Include the current line text in the snapshot
    if (currentLineIndex < lyricsLines.length) {
      typedLines[currentLineIndex] = typingBox.value;
    }

    endedAt = Date.now();
    stopLiveWpm();

    finalTypedText = getTypedSnapshot(false); // everything except current box (already saved)
    // join typedLines explicitly to avoid accidental double newlines
    finalTypedText = typedLines.join('\n');

    const targetText = fullLyrics;

    // Accuracy = 1 - (editDistance / maxLen)
    const distance = levenshteinDistance(targetText, finalTypedText);
    const maxLen = Math.max(targetText.length, finalTypedText.length) || 1;
    const accuracy = 1 - (distance / maxLen);

    // Final gross WPM from what they actually typed
    const chars = finalTypedText.replace(/\n/g, '').length; // exclude line breaks we inserted
    const ms = getElapsedMs();
    const wpm = computeGrossWpm(chars, ms);

    // Update results UI
    if (wpmSpan) wpmSpan.textContent = Math.round(wpm);
    if (accuracySpan) accuracySpan.textContent = `${Math.round(accuracy * 100)}%`;
    if (timeSpan) timeSpan.textContent = formatDuration(ms);

    // Disable typing so results freeze
    typingBox.disabled = true;

    // Reveal the "Review mistakes" button
    if (reviewBtn) reviewBtn.hidden = false;
  }

  // -----------------------
  // 8) Diff utilities for the Review modal
  //     We do a word-level edit script, then char-level diff inside substituted words.
  // -----------------------
  function splitWords(line) {
    // simple word tokenizer: split on any whitespace
    // (For review readability; strict scoring still uses character-level distance.)
    if (!line) return [];
    return line.trim().length ? line.trim().split(/\s+/) : [];
  }

  // Word-level edit script (Levenshtein backtrack with ops: eq, del, ins, sub)
  function diffWords(aWords, bWords) {
    const m = aWords.length, n = bWords.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    // init
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (aWords[i - 1] === bWords[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,     // delete
            dp[i][j - 1] + 1,     // insert
            dp[i - 1][j - 1] + 1  // substitute
          );
        }
      }
    }

    // backtrack to get ops
    const ops = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && aWords[i - 1] === bWords[j - 1]) {
        ops.push({ type: 'eq', a: aWords[i - 1], b: bWords[j - 1] });
        i--; j--;
      } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 1)) {
        ops.push({ type: 'del', a: aWords[i - 1] }); // missing in typed
        i--;
      } else if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1] + 1)) {
        ops.push({ type: 'ins', b: bWords[j - 1] }); // extra in typed
        j--;
      } else {
        // substitution
        ops.push({ type: 'sub', a: aWords[i - 1], b: bWords[j - 1] });
        i--; j--;
      }
    }
    ops.reverse();
    return ops;
  }

  // Char-level edit script between two strings (for substituted words).
  // Returns array of ops with charA/charB (depending on the op).
  function diffCharsOps(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,     // del
            dp[i][j - 1] + 1,     // ins
            dp[i - 1][j - 1] + 1  // sub
          );
        }
      }
    }

    const ops = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
        ops.push({ type: 'eq', a: a[i - 1], b: b[j - 1] });
        i--; j--;
      } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 1)) {
        ops.push({ type: 'del', a: a[i - 1] }); // missing this char in typed
        i--;
      } else if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1] + 1)) {
        ops.push({ type: 'ins', b: b[j - 1] }); // extra char typed
        j--;
      } else {
        ops.push({ type: 'sub', a: a[i - 1], b: b[j - 1] }); // wrong char
        i--; j--;
      }
    }
    ops.reverse();
    return ops;
  }

  // Render helper: append text with optional class and mistake flag.
  function appendSpan(parent, text, className = '', isMistake = false) {
    if (!text) return;
    const span = document.createElement('span');
    span.textContent = text;
    if (className) span.className = className;
    if (isMistake) span.setAttribute('data-mistake', '1');
    parent.appendChild(span);
    return span;
  }

  // Render char-level diff runs onto a parent, for one side (target or typed).
  // For target side:
  //   - eq => show a
  //   - del => show a (missing) as c-del
  //   - ins => show nothing
  //   - sub => show a as c-sub
  // For typed side:
  //   - eq => show b
  //   - del => show nothing
  //   - ins => show b as c-ins
  //   - sub => show b as c-sub
  function renderCharRuns(parent, ops, side /* 'target' | 'typed' */) {
    let buffer = '';
    let bufferClass = '';
    let bufferMistake = false;

    function flush() {
      if (!buffer) return;
      appendSpan(parent, buffer, bufferClass, bufferMistake);
      buffer = '';
      bufferClass = '';
      bufferMistake = false;
    }

    for (const op of ops) {
      let ch = '';
      let cls = '';
      let mistake = false;

      if (side === 'target') {
        if (op.type === 'eq') { ch = op.a; }
        else if (op.type === 'del') { ch = op.a; cls = 'c-del'; mistake = true; }
        else if (op.type === 'sub') { ch = op.a; cls = 'c-sub'; mistake = true; }
        else if (op.type === 'ins') { ch = ''; } // doesn't exist on target
      } else {
        if (op.type === 'eq') { ch = op.b; }
        else if (op.type === 'ins') { ch = op.b; cls = 'c-ins'; mistake = true; }
        else if (op.type === 'sub') { ch = op.b; cls = 'c-sub'; mistake = true; }
        else if (op.type === 'del') { ch = ''; } // missing in typed
      }

      // Group consecutive same-class segments into one span to keep DOM light
      if (ch) {
        if (cls === bufferClass && mistake === bufferMistake) {
          buffer += ch;
        } else {
          flush();
          buffer = ch;
          bufferClass = cls;
          bufferMistake = mistake;
        }
      } else {
        flush();
      }
    }
    flush();
  }

  // Build one line of the diff (returns an element).
  function buildLineDiff(lineNumber, targetLine, typedLine) {
    const row = document.createElement('div');
    row.className = 'diff-line';

    const targetCol = document.createElement('div');
    targetCol.className = 'diff-col target-col';
    const typedCol = document.createElement('div');
    typedCol.className = 'diff-col typed-col';

    // Optional line labels
    const label = document.createElement('div');
    label.className = 'diff-line-label';
    label.textContent = `Line ${lineNumber}`;
    row.appendChild(label);

    // Content wrappers
    const targetContent = document.createElement('div');
    targetContent.className = 'diff-content';
    const typedContent = document.createElement('div');
    typedContent.className = 'diff-content';

    const aWords = splitWords(targetLine);
    const bWords = splitWords(typedLine);
    const ops = diffWords(aWords, bWords);

    let lineHasMistake = false;

    function addSpaceIfNeeded(parent) {
      // Add a space between rendered words to keep them readable
      if (parent.lastChild && parent.lastChild.nodeType === Node.TEXT_NODE) {
        // already spacing handled
      } else if (parent.childNodes.length > 0) {
        parent.appendChild(document.createTextNode(' '));
      }
    }

    for (const op of ops) {
      if (op.type === 'eq') {
        addSpaceIfNeeded(targetContent);
        addSpaceIfNeeded(typedContent);
        appendSpan(targetContent, op.a, 'w-eq', false);
        appendSpan(typedContent, op.b, 'w-eq', false);
      } else if (op.type === 'del') {
        lineHasMistake = true;
        addSpaceIfNeeded(targetContent);
        addSpaceIfNeeded(typedContent);
        // Show the missing word on the target side
        appendSpan(targetContent, op.a, 'w-del', true);
        // On typed side, show a placeholder box so it’s obvious something is missing
        appendSpan(typedContent, '▯', 'w-missing', true);
      } else if (op.type === 'ins') {
        lineHasMistake = true;
        addSpaceIfNeeded(targetContent);
        addSpaceIfNeeded(typedContent);
        // On target side, show placeholder
        appendSpan(targetContent, '▯', 'w-missing', true);
        // Show the extra word on the typed side
        appendSpan(typedContent, op.b, 'w-ins', true);
      } else if (op.type === 'sub') {
        lineHasMistake = true;
        addSpaceIfNeeded(targetContent);
        addSpaceIfNeeded(typedContent);

        // Word replaced: do char-level diff for both sides.
        const charOps = diffCharsOps(op.a, op.b);

        // Target side (what was expected)
        const targetWordSpan = document.createElement('span');
        targetWordSpan.className = 'w-sub';
        targetWordSpan.setAttribute('data-mistake', '1');
        renderCharRuns(targetWordSpan, charOps, 'target');
        targetContent.appendChild(targetWordSpan);

        // Typed side (what user typed)
        const typedWordSpan = document.createElement('span');
        typedWordSpan.className = 'w-sub';
        typedWordSpan.setAttribute('data-mistake', '1');
        renderCharRuns(typedWordSpan, charOps, 'typed');
        typedContent.appendChild(typedWordSpan);
      }
    }

    // If there are no words at all (empty lines), still render line breaks
    if (aWords.length === 0 && bWords.length === 0) {
      // Keep columns aligned: show an empty placeholder
      appendSpan(targetContent, '—', 'w-empty', false);
      appendSpan(typedContent, '—', 'w-empty', false);
    }

    targetCol.appendChild(targetContent);
    typedCol.appendChild(typedContent);
    row.appendChild(targetCol);
    row.appendChild(typedCol);

    // Mark the entire row if it has a mistake (useful for the "only mistakes" filter)
    if (lineHasMistake) row.setAttribute('data-has-mistake', '1');

    return row;
  }

  function openReviewModal() {
    // Build per-line diff content based on finalTypedText vs fullLyrics
    diffContainer.innerHTML = '';

    const targetLines = fullLyrics.split('\n');
    const typedLinesForReview = finalTypedText.split('\n');

    for (let i = 0; i < Math.max(targetLines.length, typedLinesForReview.length); i++) {
      const tLine = targetLines[i] ?? '';
      const uLine = typedLinesForReview[i] ?? '';

      const row = buildLineDiff(i + 1, tLine, uLine);
      const hasMistake = row.hasAttribute('data-has-mistake');

      if (!onlyMistakes || hasMistake) {
        diffContainer.appendChild(row);
      }
    }

    // Collect mistake anchors for navigation (anything marked data-mistake)
    mistakeAnchors = Array.from(diffContainer.querySelectorAll('[data-mistake="1"]'));
    currentMistakeIdx = mistakeAnchors.length ? 0 : -1;

    // Show modal + backdrop
    reviewBackdrop.hidden = false;
    reviewModal.hidden = false;

    // Focus the close button for accessibility
    reviewCloseBtn?.focus();

    // If we have mistakes, scroll to the first one
    if (currentMistakeIdx >= 0) {
      scrollToCurrentMistake();
    }
  }

  function closeReviewModal() {
    reviewBackdrop.hidden = true;
    reviewModal.hidden = true;
  }

  function scrollToCurrentMistake() {
    if (currentMistakeIdx < 0 || currentMistakeIdx >= mistakeAnchors.length) return;
    const el = mistakeAnchors[currentMistakeIdx];
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Optional: briefly add a class for a pulse effect (we'll style later)
    el.classList.add('mistake-focus');
    setTimeout(() => el.classList.remove('mistake-focus'), 600);
  }

  // -----------------------
  // 9) Wire up events
  // -----------------------

  // Typing advances based on length; Enter always advances
  typingBox.addEventListener('input', () => {
    ensureTimerStarted();
    if (currentLineIndex >= lyricsLines.length) return;

    const target = rtrim(lyricsLines[currentLineIndex] ?? '');
    const typed = rtrim(typingBox.value);

    if (target.length === 0 || typed.length >= target.length) {
      advanceLine();
    }
  });

  typingBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentLineIndex < lyricsLines.length) {
        advanceLine();
      }
    }
  });

  // Submit: finalize results and reveal the review button
  submitBtn?.addEventListener('click', () => {
    finalizeResults('submit');
  });

  // Reset: start over cleanly
  resetBtn?.addEventListener('click', () => {
    // Stop timers and clear state
    stopLiveWpm();
    startedAt = null;
    endedAt = null;
    finalized = false;
    finalTypedText = '';
    onlyMistakes = false;

    // Clear text and state
    typingBox.disabled = false;
    typingBox.value = '';
    typingBox.focus();

    typedLines.length = 0;
    currentLineIndex = 0;

    // Reset results UI
    if (wpmSpan) wpmSpan.textContent = '0';
    if (accuracySpan) accuracySpan.textContent = '0%';
    if (timeSpan) timeSpan.textContent = '0:00';

    // Hide review button and modal
    if (reviewBtn) reviewBtn.hidden = true;
    closeReviewModal();

    // Re-render lyrics window
    updateLyricsDisplay();
  });

  // Review modal controls
  reviewBtn?.addEventListener('click', () => {
    if (!finalized) return; // should be finalized before review
    openReviewModal();
  });
  reviewCloseBtn?.addEventListener('click', closeReviewModal);
  reviewBackdrop?.addEventListener('click', closeReviewModal);

  // Keyboard: Esc closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !reviewModal.hidden) {
      closeReviewModal();
    }
  });

  // Navigate mistakes
  prevMistakeBtn?.addEventListener('click', () => {
    if (!mistakeAnchors.length) return;
    currentMistakeIdx = (currentMistakeIdx - 1 + mistakeAnchors.length) % mistakeAnchors.length;
    scrollToCurrentMistake();
  });
  nextMistakeBtn?.addEventListener('click', () => {
    if (!mistakeAnchors.length) return;
    currentMistakeIdx = (currentMistakeIdx + 1) % mistakeAnchors.length;
    scrollToCurrentMistake();
  });

  // Toggle only-mistakes view
  toggleOnlyMistakesBtn?.addEventListener('click', () => {
    onlyMistakes = !onlyMistakes;
    openReviewModal(); // rebuild with the new filter
  });

  // -----------------------
  // 10) Initial render
  // -----------------------
  updateLyricsDisplay();
  typingBox?.focus();

  // Optional: hook up song play/pause if your HTML uses the IDs from earlier
  const audio = document.querySelector('#song-player audio');
  document.getElementById('song-play-btn')?.addEventListener('click', () => audio?.play());
  document.getElementById('song-pause-btn')?.addEventListener('click', () => audio?.pause());
});