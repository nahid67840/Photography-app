firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();

const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message");
const imageUpload = document.getElementById("image-upload");
const imagePreview = document.getElementById("image-preview");
const userInfo = document.getElementById("user-info");
const ding = document.getElementById("ding");

let currentUser = null;

auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    document.getElementById("login-area").style.display = "none";
    document.getElementById("chat-area").style.display = "block";
    userInfo.innerHTML = "<b>Logged in as:</b> " + user.email;
    loadMessages();
  } else {
    currentUser = null;
    document.getElementById("login-area").style.display = "block";
    document.getElementById("chat-area").style.display = "none";
  }
});

function login() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, pass).catch(alert);
}

function signup() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, pass).catch(alert);
}

function logout() {
  auth.signOut();
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text && !imageUpload.files[0]) return;

  let msg = { user: currentUser.email, time: Date.now(), text };

  if (imageUpload.files[0]) {
    const file = imageUpload.files[0];
    const ref = storage.ref("images/" + Date.now() + "_" + file.name);
    ref.put(file).then(snapshot => {
      snapshot.ref.getDownloadURL().then(url => {
        msg.image = url;
        db.ref("messages").push(msg);
      });
    });
  } else {
    db.ref("messages").push(msg);
  }

  messageInput.value = "";
  imageUpload.value = "";
  imagePreview.innerHTML = "";
}

function loadMessages() {
  db.ref("messages").on("child_added", snap => {
    const m = snap.val();
    const div = document.createElement("div");
    div.className = "message " + (m.user === currentUser.email ? "user" : "other");
    div.innerHTML = "<b>" + m.user + ":</b> " + (m.text || "");
    if (m.image) {
      const img = document.createElement("img");
      img.src = m.image;
      img.style = "max-width:200px;display:block;margin-top:5px;";
      div.appendChild(img);
    }
    const time = new Date(m.time).toLocaleTimeString();
    div.innerHTML += `<br><small>${time}</small>`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    if (m.user !== currentUser.email) ding.play();
  });
}

document.getElementById("dark-toggle").onclick = () => {
  document.body.classList.toggle("dark");
};

imageUpload.onchange = () => {
  if (imageUpload.files[0]) {
    imagePreview.innerHTML = "📸 " + imageUpload.files[0].name;
  }
};