from flask import Blueprint , render_template , redirect , url_for , flash , request , session 

from flask_login import login_user, logout_user, login_required, current_user 

from .models import User
from . import db
from werkzeug.security import generate_password_hash, check_password_hash 

auth = Blueprint("auth", __name__)

@auth.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        user = User.query.filter_by(email=email).first()


        if user and check_password_hash(user.password, password):
            login_user(user,remember=bool(request.form.get("remember")))
            next_page = request.args.get("next")
            return redirect(next_page or url_for("views.dashboard"))
        else:
            flash("Invalid credentials", category="error")
        
    return render_template("login.html", show_profile=False)


@auth.route("/signup", methods= ["GET", "POST"])
def signUp():
    if request.method == "POST":
        email = request.form.get("email")
        password1 = request.form.get("password1")
        password2 =  request.form.get("password2")
        firstName = request.form.get("firstName")
        lastName = request.form.get("lastName")
        avatar = request.form.get("avatar")
       # print(f"{firstName}, {email}, {password}, {lastName}")

        # check for empty field.
        if not email or not firstName or not lastName or not password1 or not password2: 
            flash("fill all the fields.", category="error")
            return render_template("signUp.html")

        # password checks: 
        elif password1 != password2:
            flash('Passwords dont match!', category="error")
            return render_template("signUp.html")
        
        elif len(password1) < 6:
            flash("Password too short!", category="error")
            return render_template("signUp.html")

        #empty field check.
        elif not email.strip() or not firstName.strip() or not lastName.strip():
            flash("Enter correct values.", category="error")
            return render_template("signUp.html" )



        
        # check if user already exist.

        user = User.query.filter_by(email=email).first()
        if user:
              flash("Email already exists", category="error")
              return render_template("signUp.html")
        
        # create new user.

        new_user = User(
              email = email,
              firstName = firstName,
              lastName = lastName,
              password=generate_password_hash(password1, method="pbkdf2:sha256"),
              avatar = avatar
        )
        db.session.add(new_user)
        db.session.commit()

        flash("Account created successfully", category="success")
        return redirect(url_for("views.dashboard"))
    
    return render_template("signUp.html" )

@auth.route("/profile")
@login_required
def profile():
      return redirect(url_for('profile.html'))

@auth.route("/selectSong")
@login_required
def selectSong():
      return redirect(url_for("selectSong.html"))

@auth.route("/logout")
@login_required
def logout():
        logout_user()
        return redirect(url_for('auth.login'))

@auth.route("/changePassword" , methods=["POST"])
@login_required
def changePassword():
     old_password = request.form.get("old-password")
     new_password1 = request.form.get("new-password1")
     new_password2 = request.form.get("new-password2")

     # Step1: check old password

     if not check_password_hash(current_user.password, old_password):
          flash("Old password is incorrect!", category="error")
          return redirect(url_for("views.profile"))
     if new_password1 != new_password2 :
          flash("New Passwords Mismatch.", category="error")
          return redirect(url_for("views.profile"))
     if old_password == new_password1 :
          flash("New password and Old Password must be different", category="error")
          return redirect(url_for("views.profile"))
     if len(new_password1) <6 :
          flash("Password is too short.", category="error")
          return redirect(url_for("views.profile"))
     
     #hash + save
     current_user.password =  generate_password_hash(new_password1 , method="pbkdf2:sha256")
     db.session.commit()

     flash("Password Updated", category="success")
     return redirect(url_for("views.profile"))

@auth.route("/edit_info" , methods=["POST"])
@login_required
def editInfo():
     changed_first_name = request.form.get("changedFirstName")
     changed_last_name = request.form.get("changedLastName")
     changed_email = request.form.get("changedInfoEmail")

     if changed_first_name:
          current_user.firstName = changed_first_name
     if changed_last_name:
          current_user.lastName = changed_last_name
     if changed_email:
          existing_user = User.query.filter_by(email=changed_email).first()
          if existing_user and existing_user.id != current_user.id:
               flash("Email already taken!", category="error")
               return redirect(url_for("views.profile"))
          current_user.email = changed_email

     db.session.commit()
     flash("Profile updated successfully!", category="success")
     return redirect(url_for("views.dashboard"))

@auth.route("/delete-account" , methods=["POST"] )
@login_required
def deleteAccount():
     password = request.form.get("deleteAccountPasswordField")

     if not password:
          flash("Password enter your password to confirm account deletion.", category='error')
          return redirect(url_for("views.profile"))
     
     if not check_password_hash(current_user.password, password):
          flash("Password Mismatch!", category="error")
          return redirect(url_for("views.profile"))
     
     
     try:          
                    db.session.delete(current_user)
                    db.session.commit()
     except Exception as e:
                    db.session.rollback()
                    current_user.logger.exception("Failed ot delete user")
                    flash("An error occurred while deletiing your account,Please try again.")
                    flash("Account deleted!", category="success")
                    return redirect(url_for("auth.login"))
     logout_user()
     flash('Account deleted!')
     return redirect(url_for("auth.login"))

@auth.route("/changeAvatar", methods=["POST"])
@login_required
def change_avatar():
      selected_avatar = request.form.get("avatar")
      if not selected_avatar:
            flash("Please select an Avatar!", category="error")
            return redirect(url_for("views.profile"))
      
      current_user.avatar = selected_avatar
      db.session.commit()

      flash('Avatar updated!', category="success")
      return redirect(url_for("views.profile"))

     
@auth.route("/aboutMe")
def aboutMe():
     return redirect(url_for('auth.aboutMe'))

@auth.route('/theme', methods=['POST'])
def theme():
     font_family = request.form.get('fontFamily', 'Arial')
     font_size = request.form.get('fontSize' , '12')

     session['font_family'] = font_family
     session['font_size'] = f"{font_size}px"

     flash ("Theme Updated successfully", category='success')
     return redirect(url_for('views.profile',))