let isEditing = false; // Indica se il form è in modalità modifica
let editingPersonaggioId = null; // Salva l'ID del personaggio in modifica

// Funzione per caricare le razze dal backend
async function loadRazze() {
  try {
    const response = await fetch(
      "https://final-fantasy-tactics-advance-tracking.onrender.com/api/razze"
    );
    const razze = await response.json();

    const dropdown = document.getElementById("razza-dropdown");

    // Aggiungi le opzioni al dropdown
    razze.forEach((razza) => {
      const option = document.createElement("option");
      option.value = razza.id;
      option.textContent = razza.nome;
      dropdown.appendChild(option);
    });
  } catch (error) {
    console.error("Errore nel caricamento delle razze:", error);
  }
}

// Funzione per generare stelle
function generateStars(value) {
  const maxStars = 5; // Numero massimo di stelle
  const filledStars = Math.min(Math.round(value), maxStars); // Stelle piene basate sul valore
  const emptyStars = maxStars - filledStars;

  // Genera il codice HTML per le stelle con una classe specifica
  return `<span class="stars">${"★".repeat(filledStars)}${"☆".repeat(
    emptyStars
  )}</span>`;
}

// Funzione per caricare i job
async function loadJob(razzaId) {
  try {
    const url =
      razzaId === "all"
        ? "https://final-fantasy-tactics-advance-tracking.onrender.com/api/job"
        : `https://final-fantasy-tactics-advance-tracking.onrender.com/api/job?razza=${razzaId}`;

    const response = await fetch(url);
    const jobs = await response.json();

    const tableBody = document.querySelector("#job-table tbody");
    const razzaColumn = document.querySelector("th:nth-child(3)"); // Intestazione della colonna Razza
    tableBody.innerHTML = ""; // Svuota la tabella

    // Nascondi o mostra la colonna Razza in base alla selezione
    if (razzaId !== "all") {
      razzaColumn.style.display = "none"; // Nasconde la colonna Razza
    } else {
      razzaColumn.style.display = ""; // Mostra la colonna Razza
    }

    // Aggiungi i job alla tabella
    jobs.forEach((job) => {
      const row = document.createElement("tr");

      row.innerHTML = `
          <td>${job.id}</td>
          <td>${job.nome}</td>
          <td style="display: ${razzaId === "all" ? "" : "none"}">${
        job.razzanome || ""
      }</td>
          <td>${job.requisiti || ""}</td>
          <td>${job.descrizione || ""}</td>
          <td>${generateStars(job.forza || 0)}</td>
          <td>${generateStars(job.destrezza || 0)}</td>
          <td>${generateStars(job.magia || 0)}</td>
          <td>${generateStars(job.voto || 0)}</td>
        `;

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Errore nel caricamento dei job:", error);
  }
}

// Event listener per il pulsante di ricerca
document.getElementById("search-btn").addEventListener("click", () => {
  const dropdown = document.getElementById("razza-dropdown");
  const razzaId = dropdown.value;
  loadJob(razzaId);
});

// Carica le razze al caricamento della pagina
window.onload = () => {
  loadRazze();
  loadJob("all"); // Carica tutti i job inizialmente
};

// Funzione per caricare i personaggi
async function loadPersonaggi() {
  try {
    const response = await fetch(
      "https://final-fantasy-tactics-advance-tracking.onrender.com/api/personaggi"
    );
    const personaggi = await response.json();

    const tableBody = document.querySelector("#personaggio-table tbody");
    tableBody.innerHTML = ""; // Svuota la tabella

    // Aggiungi i personaggi alla tabella
    personaggi.forEach((personaggio) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${personaggio.id}</td>
        <td>${personaggio.nome}</td>
        <td>${personaggio.razzanome}</td>
        <td>${personaggio.jobattuale || "Nessun job"}</td>
        <td>
          <button class="btn btn-edit" data-id="${
            personaggio.id
          }">Modifica</button>
          <button class="btn btn-delete" data-id="${
            personaggio.id
          }">Elimina</button>
        </td>
      `;

      tableBody.appendChild(row);
    });

    // Aggiungi il listener ai pulsanti di eliminazione
    document.querySelectorAll(".btn-delete").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const personaggioId = event.target.dataset.id;
        const personaggioNome = event.target.dataset.nome;
        const conferma = confirm(
          `Sei sicuro di voler eliminare il personaggio "${personaggioNome}"?`
        );

        if (conferma) {
          await deletePersonaggio(personaggioId);
        }
      });
    });

    // Aggiungi il listener ai pulsanti di modifica
    document.querySelectorAll(".btn-edit").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const personaggioId = event.target.dataset.id;
        await editPersonaggio(personaggioId);
      });
    });
  } catch (error) {
    console.error("Errore nel caricamento dei personaggi:", error);
  }
}

// Funzione per gestire la modifica di un personaggio
async function editPersonaggio(personaggioId) {
  isEditing = true; // Stiamo modificando un personaggio
  editingPersonaggioId = personaggioId; // Salva l'ID del personaggio in modifica

  try {
    const response = await fetch(
      `https://final-fantasy-tactics-advance-tracking.onrender.com/api/personaggi/${personaggioId}`
    );
    const personaggio = await response.json();
    console.log("Edit personaggio:", {
      nomePersonaggio: personaggio.nome,
      idRazzaPersonaggio: personaggio.idrazza,
      idJobAttualePersonaggio: personaggio.idjobattuale,
    });

    const modal = document.getElementById("personaggio-modal");
    modal.style.display = "flex";

    // Carica le razze nel dropdown
    await loadRazzeForForm();

    // Imposta i valori del modulo
    document.getElementById("personaggio-nome").value = personaggio.nome;
    document.getElementById("personaggio-razza").value = personaggio.idrazza;
    await loadJobForRazza(personaggio.idrazza);

    if (personaggio.idjobattuale) {
      document.getElementById("personaggio-job").value =
        personaggio.idjobattuale;
    }

    console.log("Form valori impostati:", {
      nome: document.getElementById("personaggio-nome").value,
      idRazza: document.getElementById("personaggio-razza").value,
      idJobAttuale: document.getElementById("personaggio-job").value,
    });

    // Configura il listener per il submit
    const form = document.getElementById("personaggio-form");
    form.onsubmit = null; // Rimuovi eventuali listener precedenti

    form.onsubmit = async (event) => {
      event.preventDefault();

      // Recupera i valori dal form
      const nome = document.getElementById("personaggio-nome").value;
      const idRazza = document.getElementById("personaggio-razza").value;
      const idJobAttuale =
        document.getElementById("personaggio-job").value || null;

      console.log("Valori letti dal form:", { nome, idRazza, idJobAttuale });

      await updatePersonaggio(personaggioId, nome, idRazza, idJobAttuale);
      modal.style.display = "none";
      loadPersonaggi(); // Ricarica la tabella
    };
  } catch (error) {
    console.error("Errore durante il caricamento del personaggio:", error);
  }
}

// Funzione per aggiornare un personaggio
async function updatePersonaggio(personaggioId, nome, idRazza, idJobAttuale) {
  console.log("Valori inviati a updatePersonaggio:", {
    personaggioId,
    nome,
    idRazza,
    idJobAttuale,
  });

  try {
    const response = await fetch(
      `https://final-fantasy-tactics-advance-tracking.onrender.com/api/personaggi/${personaggioId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nome, idRazza, idJobAttuale }),
      }
    );

    if (response.ok) {
      alert("Personaggio aggiornato con successo!");
    } else {
      const error = await response.json();
      alert("Errore durante l'aggiornamento: " + error.error);
    }
  } catch (error) {
    console.error("Errore durante l'aggiornamento del personaggio:", error);
  }
}

async function createPersonaggio(nome, idRazza, idJobAttuale) {
  try {
    const response = await fetch(
      "https://final-fantasy-tactics-advance-tracking.onrender.com/api/personaggi",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nome, idRazza, idJobAttuale }),
      }
    );

    if (response.ok) {
      alert("Personaggio creato con successo!");
    } else {
      const error = await response.json();
      alert("Errore durante la creazione: " + error.error);
    }
  } catch (error) {
    console.error("Errore durante la creazione del personaggio:", error);
  }
}

async function updatePersonaggio(personaggioId, nome, idRazza, idJobAttuale) {
  console.log("Valori inviati:", { nome, idRazza, idJobAttuale });
  try {
    const response = await fetch(
      `https://final-fantasy-tactics-advance-tracking.onrender.com/api/personaggi/${personaggioId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nome, idRazza, idJobAttuale }),
      }
    );

    if (response.ok) {
      alert("Personaggio aggiornato con successo!");
    } else {
      const error = await response.json();
      alert("Errore durante l'aggiornamento: " + error.error);
    }
  } catch (error) {
    console.error("Errore durante l'aggiornamento del personaggio:", error);
  }
}

// Funzione per eliminare un personaggio
async function deletePersonaggio(personaggioId) {
  try {
    const response = await fetch(
      `https://final-fantasy-tactics-advance-tracking.onrender.com/api/personaggi/${personaggioId}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      alert("Personaggio eliminato con successo!");
      loadPersonaggi(); // Ricarica la tabella
    } else {
      const error = await response.json();
      alert("Errore durante l'eliminazione: " + error.error);
    }
  } catch (error) {
    console.error("Errore durante l'eliminazione del personaggio:", error);
  }
}

// Funzione per mostrare la sezione selezionata
function showSection(sectionId) {
  document.querySelector("#job-viewer").style.display =
    sectionId === "job-viewer" ? "block" : "none";
  document.querySelector("#personaggio-viewer").style.display =
    sectionId === "personaggio-viewer" ? "block" : "none";
}

// Event listener per il menù laterale
document.getElementById("menu-job").addEventListener("click", () => {
  showSection("job-viewer");
  loadJob("all"); // Carica tutti i job
});

document.getElementById("menu-abilita").addEventListener("click", () => {
  alert("Gestione delle abilità non ancora implementata!"); // Placeholder
});

document.getElementById("menu-personaggi").addEventListener("click", () => {
  showSection("personaggio-viewer");
  loadPersonaggi();
});

// Funzione per caricare le razze nel form
async function loadRazzeForForm() {
  try {
    const response = await fetch(
      "https://final-fantasy-tactics-advance-tracking.onrender.com/api/razze"
    );
    const razze = await response.json();

    const dropdown = document.getElementById("personaggio-razza");
    dropdown.innerHTML = ""; // Svuota il dropdown

    razze.forEach((razza) => {
      const option = document.createElement("option");
      option.value = razza.id;
      option.textContent = razza.nome;
      dropdown.appendChild(option);
    });
  } catch (error) {
    console.error("Errore nel caricamento delle razze:", error);
  }
}

// Funzione per caricare i job nel form
async function loadJobForForm() {
  try {
    const response = await fetch(
      "https://final-fantasy-tactics-advance-tracking.onrender.com/api/job"
    );
    const jobs = await response.json();

    const dropdown = document.getElementById("personaggio-job");
    dropdown.innerHTML = '<option value="">Nessun job</option>'; // Aggiungi l'opzione "Nessun job"

    jobs.forEach((job) => {
      const option = document.createElement("option");
      option.value = job.id;
      option.textContent = job.nome;
      dropdown.appendChild(option);
    });
  } catch (error) {
    console.error("Errore nel caricamento dei job:", error);
  }
}

// Mostra il modale e resetta i valori
document
  .getElementById("add-personaggio-btn")
  .addEventListener("click", async () => {
    isEditing = false; // Stiamo creando un nuovo personaggio
    editingPersonaggioId = null; // Nessun ID in modifica

    const modal = document.getElementById("personaggio-modal");
    modal.style.display = "flex";

    // Resetta il form
    document.getElementById("personaggio-form").reset();

    // Carica le razze e resetta i job
    await loadRazzeForForm();
    const dropdownJob = document.getElementById("personaggio-job");
    dropdownJob.innerHTML = '<option value="">Nessun job</option>';

    // Configura il listener per il submit
    const form = document.getElementById("personaggio-form");
    form.onsubmit = null;

    form.onsubmit = async (event) => {
      event.preventDefault();
      const nome = document.getElementById("personaggio-nome").value;
      const idRazza = document.getElementById("personaggio-razza").value;
      const idJobAttuale =
        document.getElementById("personaggio-job").value || null;
      await createPersonaggio(nome, idRazza, idJobAttuale);
      modal.style.display = "none";
      loadPersonaggi(); // Ricarica la tabella
    };
  });

// Chiudi il modale con il pulsante "×"
document.getElementById("close-modal").addEventListener("click", () => {
  const modal = document.getElementById("personaggio-modal");
  modal.style.display = "none";
});

// Funzione per caricare le razze nel dropdown Razza
async function loadRazzeForForm() {
  try {
    const response = await fetch(
      "https://final-fantasy-tactics-advance-tracking.onrender.com/api/razze"
    );
    const razze = await response.json();

    const dropdownRazza = document.getElementById("personaggio-razza");
    dropdownRazza.innerHTML = ""; // Svuota il dropdown

    razze.forEach((razza) => {
      const option = document.createElement("option");
      option.value = razza.id;
      option.textContent = razza.nome;
      dropdownRazza.appendChild(option);
    });
  } catch (error) {
    console.error("Errore nel caricamento delle razze:", error);
  }
}

// Funzione per caricare i job nel dropdown Job in base alla razza selezionata
async function loadJobForRazza(razzaId) {
  try {
    const response = await fetch(
      `https://final-fantasy-tactics-advance-tracking.onrender.com/api/job?razza=${razzaId}`
    );
    const jobs = await response.json();

    const dropdownJob = document.getElementById("personaggio-job");
    dropdownJob.innerHTML = '<option value="">Nessun job</option>'; // Aggiungi l'opzione "Nessun job"

    jobs.forEach((job) => {
      const option = document.createElement("option");
      option.value = job.id;
      option.textContent = job.nome;
      dropdownJob.appendChild(option);
    });
  } catch (error) {
    console.error("Errore nel caricamento dei job:", error);
  }
}

// Event listener per cambiare i job quando si seleziona una razza
document
  .getElementById("personaggio-razza")
  .addEventListener("change", (event) => {
    const razzaId = event.target.value;
    if (razzaId) {
      loadJobForRazza(razzaId);
    }
  });

// Mostra il modale
document.getElementById("add-personaggio-btn").addEventListener("click", () => {
  const modal = document.getElementById("personaggio-modal");
  modal.style.display = "flex";

  // Carica le razze nel form e svuota i job
  loadRazzeForForm();
  const dropdownJob = document.getElementById("personaggio-job");
  dropdownJob.innerHTML = '<option value="">Nessun job</option>';
});

// Chiudi il modale
document.getElementById("close-modal").addEventListener("click", () => {
  const modal = document.getElementById("personaggio-modal");
  modal.style.display = "none";
});

// Carica i dati iniziali
window.onload = () => {
  loadRazze();
  loadJob("all");
};

document.getElementById("cancel-modal-btn").addEventListener("click", () => {
  const modal = document.getElementById("personaggio-modal");
  modal.style.display = "none";

  // Resetta eventuali valori del form
  document.getElementById("personaggio-form").reset();
});
