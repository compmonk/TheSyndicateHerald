const extend = function (formArray) {
    let result = {};
    for (let i = 0; i < formArray.length; i++) {
        result[formArray[i]['name']] = formArray[i]['value'];
    }
    return result;
};

function usernameCheck() {
    const signupForm = document.getElementById("signup-form");

    if (signupForm) {
        $("#username-error-container").addClass("hidden");
        $("#username-error-text").text("");
        const username = document.getElementById("username").value;
        if (username && typeof username === "string") {
            console.log(username)
            $.post("/username", {username: username}).then(function (response) {
                    if (!response["valid"]) {
                        console.log(`${username} not available`)
                        $("#username-error-container").removeClass("hidden");
                        $("#username-error-text").text("Username not available");
                    }
                }
            );
        }
    }
}

function cleanSignUpForm() {
    $("#first-name-error-container").addClass("hidden");
    $("#first-name-error-text").text("");
    $("#last-name-error-container").addClass("hidden");
    $("#last-name-error-text").text("");
    $("#email-error-container").addClass("hidden");
    $("#email-error-text").text("");
    $("#username-error-container").addClass("hidden");
    $("#username-error-text").text("");
    $("#password-error-container").addClass("hidden");
    $("#password-error-text").text("");
}

function signUp() {
    const signupForm = document.getElementById("signup-form");

    let valid = true;

    if (signupForm) {

        cleanSignUpForm();

        const firstName = document.getElementById("firstName").value;
        if (firstName === "" || typeof firstName !== "string") {
            valid = false;
            $("#first-name-error-container").removeClass("hidden");
            $("#first-name-error-text").text("Please enter a valid First Name");
        }

        const lastName = document.getElementById("lastName").value;
        if (lastName === "" || typeof lastName !== "string") {
            valid = false;
            $("#last-name-error-container").removeClass("hidden");
            $("#last-name-error-text").text("Please enter a valid Last Name");
        }

        const email = document.getElementById("email").value;
        if (email === "" || typeof email !== "string") {
            valid = false;
            $("#email-error-container").removeClass("hidden");
            $("#email-error-text").text("Please enter a valid Email");
        }

        const username = document.getElementById("username").value;
        if (username === "" || typeof username !== "string") {
            valid = false;
            $("#username-error-container").removeClass("hidden");
            $("#username-error-text").text("Please enter a valid Username");
        }

        const password = document.getElementById("password").value;
        if (password === "" || typeof password !== "string") {
            valid = false;
            $("#password-error-container").removeClass("hidden");
            $("#password-error-text").text("Please enter a valid Password");
        }

        if (password.length < 8 || 15 < password.length) {
            valid = false;
            $("#password-error-container").removeClass("hidden");
            $("#password-error-text").text("Please length must be between 8 and 15 characters");
        }

        if (valid) {
            $.post("/signup", extend($("#signup-form").serializeArray()));
        } else {
            $("#signup-form").submit(function (e) {
                e.preventDefault();
            })
        }
    }
}

function login() {
    const loginForm = document.getElementById("login-form");

    let valid = true;

    if (loginForm) {
        const userame = document.getElementById("login-username").value;
        if (userame === "" || typeof userame !== "string") {
            valid = false;
            $("#login-username-error-container").removeClass("hidden");
            $("#login-username-error-text").text("Please enter your username");
        }

        const password = document.getElementById("login-password").value;
        if (password === "" || typeof password !== "string") {
            valid = false;
            $("#login-password-error-container").removeClass("hidden");
            $("#login-password-error-text").text("Please enter your password");
        }

        if (valid) {
            $.post("/login", extend($("#login-form").serializeArray()))
                .done(function (msg) {
                    console.log("logged in");
                    console.log(msg)
                })
                .fail(function (jqXHR, status, error) {
                    console.log("invalid username/password")
                    console.log(jqXHR.responseText);
                    console.log(status);
                    console.log(error);
                    if (status === 403) {
                        $("#login-form-error-container").removeClass("hidden");
                        $("#login-form-error-text").text("Please enter correct username and password");
                    } else if (status === 404) {
                        $("#login-form-error-container").removeClass("hidden");
                        $("#login-form-error-text").text(`username ${userame} not found`);
                    }
                });
        } else {
            $("#signup-form").submit(function (e) {
                e.preventDefault();
            })
        }
    }
}