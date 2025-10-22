const roleButtons = document.querySelectorAll(".role");
const renterTabs = document.getElementById("renterTabs");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const tabButtons = document.querySelectorAll(".tab");

let selectedRole = "Owner";

// Role selection
roleButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    roleButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedRole = btn.dataset.role;

    if (selectedRole === "Renter") {
      renterTabs.classList.remove("hidden");
      formTitle.textContent = "Renter Access";
      formSubtitle.textContent = "Login or create your renter account";
      showForm("login"); // default to login
    } else {
      renterTabs.classList.add("hidden");
      formTitle.textContent = "Sign In";
      formSubtitle.textContent = "Choose your role and access your account";
      showForm("login");
    }
  });
});

// Tab switching for renter
tabButtons.forEach(tab => {
  tab.addEventListener("click", () => {
    tabButtons.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    showForm(tab.dataset.tab);
  });
});

// Show login or register form
function showForm(type) {
  if (type === "login") {
    loginForm.classList.add("active");
    registerForm.classList.remove("active");
  } else if (type === "register") {
    registerForm.classList.add("active");
    loginForm.classList.remove("active");
  }
}

// ✅ Remember Me: Load saved email if exists
window.addEventListener("DOMContentLoaded", () => {
  const savedEmail = localStorage.getItem("rememberedEmail");
  if (savedEmail) {
    document.getElementById("loginEmail").value = savedEmail;
    document.getElementById("remember").checked = true;
  }
});

// Handle login form submission
loginForm.addEventListener("submit", function(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const remember = document.getElementById("remember").checked;

  if (!email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  // Save or clear remembered email
  if (remember) {
    localStorage.setItem("rememberedEmail", email);
  } else {
    localStorage.removeItem("rememberedEmail");
  }

  alert(`Logging in as ${selectedRole}\nEmail: ${email}\nRemember me: ${remember}`);
});

// Handle register form submission
registerForm.addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const confirm = document.getElementById("regConfirm").value.trim();

  if (!name || !email || !password || !confirm) {
    alert("Please fill in all fields.");
    return;
  }

  if (password !== confirm) {
    alert("Passwords do not match!");
    return;
  }

  alert(`Registering new Renter:\nName: ${name}\nEmail: ${email}`);
});
