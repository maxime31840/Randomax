const API_BASE = "https://api-a1s2.iris-occitanie.fr/api";

window.addEventListener("DOMContentLoaded", () => {
  chargerMessages();
});

document.getElementById("messageForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const content = document.getElementById("content").value.trim();
  const responseDiv = document.getElementById("responseMessage");

  if (!username || !content) {
    responseDiv.innerText = "❌ Merci de remplir tous les champs.";
    responseDiv.style.color = "red";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, content })
    });

    if (!res.ok) throw new Error("Erreur lors de l'envoi du message.");

    const data = await res.json();
    responseDiv.innerText = `✅ ${data.message}`;
    responseDiv.style.color = "green";
    this.reset();
    chargerMessages();
  } catch (error) {
    responseDiv.innerText = `❌ ${error.message}`;
    responseDiv.style.color = "red";
  }
});

async function chargerMessages() {
  const messagesList = document.getElementById("messagesList");
  messagesList.innerHTML = "<p>Chargement...</p>";

  try {
    const res = await fetch(`${API_BASE}/messages?nb_messages=10`);
    if (!res.ok) throw new Error("Erreur API messages");

    const data = await res.json();
    const messages = data.data;

    if (messages.length === 0) {
      messagesList.innerHTML = "<p>Aucun message pour le moment.</p>";
      return;
    }

    messagesList.innerHTML = "";

    for (const msg of messages) {
      const div = document.createElement("div");
      div.classList.add("message");

      div.innerHTML = `
        <strong>${msg.username}</strong>
        <small>${new Date(msg.created_at).toLocaleString()}</small><br/>
        <p>${msg.content}</p>
        <button class="like-btn" data-id="${msg.id}">❤️ ${msg.like}</button>

        <div class="comment-section" id="comments-${msg.id}">
          <h4>Commentaires</h4>
          <div class="comments-list" id="comment-list-${msg.id}">Chargement...</div>
          <form class="comment-form" data-id="${msg.id}">
            <input type="text" placeholder="Votre nom" class="comment-username" required />
            <input type="text" placeholder="Ajouter un commentaire..." class="comment-content" required />
            <button type="submit">Envoyer</button>
          </form>
        </div>
      `;

      div.querySelector(".like-btn").addEventListener("click", () => {
        likerMessage(msg.id);
      });

      div.querySelector(".comment-form").addEventListener("submit", async function (e) {
        e.preventDefault();
        const username = this.querySelector(".comment-username").value.trim();
        const content = this.querySelector(".comment-content").value.trim();
        if (!username || !content) return;

        await ajouterCommentaire(msg.id, username, content);
        this.reset();
        chargerCommentaires(msg.id);
      });

      messagesList.appendChild(div);
      await chargerCommentaires(msg.id); 
    }
  } catch (err) {
    messagesList.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
  }
}

async function likerMessage(messageId) {
  try {
    const res = await fetch(`${API_BASE}/message/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message_id: messageId })
    });

    if (!res.ok) throw new Error("Erreur lors du like");

    const data = await res.json();
    console.log("👍 Like envoyé :", data.message);
    chargerMessages();
  } catch (err) {
    console.error("❌ Erreur like :", err.message);
  }
}

async function chargerCommentaires(messageId) {
  const container = document.getElementById(`comment-list-${messageId}`);
  try {
    const res = await fetch(`${API_BASE}/comments?message_id=${messageId}`);
    if (!res.ok) throw new Error("Erreur commentaires");

    const data = await res.json();
    const commentaires = data.data;

    if (commentaires.length === 0) {
      container.innerHTML = "<em>Aucun commentaire.</em>";
      return;
    }

    container.innerHTML = "";
    commentaires.forEach(com => {
      const p = document.createElement("p");
      p.innerHTML = `<strong>${com.username}</strong>: ${com.content}`;
      container.appendChild(p);
    });
  } catch (err) {
    container.innerHTML = `<span style="color:red;">❌ ${err.message}</span>`;
  }
}

async function ajouterCommentaire(messageId, username, content) {
  try {
    const res = await fetch(`${API_BASE}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message_id: messageId, username, content })
    });

    if (!res.ok) throw new Error("Erreur lors de l'ajout du commentaire");
    const data = await res.json();
    console.log("💬 Commentaire ajouté :", data.message);
  } catch (err) {
    console.error("❌ Erreur commentaire :", err.message);
  }
}
