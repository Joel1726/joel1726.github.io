// ======================================================
// JOEL.AVRTS.STUDIO
// SISTEMA DE CLIENTES Y FIDELIZACIÓN
// REGLA: CADA SERVICIO = 5 PUNTOS
// ======================================================


// ================= DATOS =================

let clients = JSON.parse(
    localStorage.getItem("barberClients")
) || [];

let commissionRate =
    Number(localStorage.getItem("commissionRate")) || 40;

let selectedClientId = null;


// ================= NORMALIZAR CLIENTES =================

// Esto evita errores si ya tenías clientes guardados
// de una versión anterior.

clients.forEach(client => {

    client.visits = Number(client.visits) || 0;

    client.spent = Number(client.spent) || 0;

    client.points = Number(client.points) || 0;

    client.history = Array.isArray(client.history)
        ? client.history
        : [];

});

saveClients();


// ================= FUNCIONES GENERALES =================

function saveClients() {

    localStorage.setItem(
        "barberClients",
        JSON.stringify(clients)
    );

}


function formatMoney(value) {

    return `S/ ${Number(value || 0).toFixed(2)}`;

}


function formatDate(date) {

    const d = new Date(date);

    return d.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

}


function getAllVisits() {

    let visits = [];

    clients.forEach(client => {

        if (!Array.isArray(client.history)) {
            return;
        }

        client.history.forEach(history => {

            visits.push({

                id: history.id,

                clientId: client.id,

                clientName: client.name,

                service: history.service,

                price: Number(history.price) || 0,

                date: history.date

            });

        });

    });

    return visits.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

}


function getTotalGenerated() {

    return getAllVisits().reduce(
        (total, visit) => total + Number(visit.price),
        0
    );

}


// ================= NAVEGACIÓN =================

const menuItems =
    document.querySelectorAll(".menu-item");

menuItems.forEach(button => {

    button.addEventListener("click", () => {

        const sectionId =
            button.getAttribute("data-section");

        showSection(sectionId);

    });

});


function showSection(sectionId) {

    document
        .querySelectorAll(".page-section")
        .forEach(section => {
            section.classList.remove("active");
        });


    const selectedSection =
        document.getElementById(sectionId);

    if (selectedSection) {
        selectedSection.classList.add("active");
    }


    menuItems.forEach(item => {

        item.classList.remove("active");

        if (
            item.getAttribute("data-section")
            === sectionId
        ) {
            item.classList.add("active");
        }

    });


    const titles = {

        dashboardSection: [
            "Dashboard",
            "Resumen de tu barbería"
        ],

        clientsSection: [
            "Clientes",
            "Gestiona tus clientes"
        ],

        visitsSection: [
            "Visitas",
            "Historial de servicios"
        ],

        benefitsSection: [
            "Beneficios",
            "Programa de fidelización"
        ],

        incomeSection: [
            "Ingresos",
            "Control de tus ingresos"
        ],

        settingsSection: [
            "Configuración",
            "Personaliza tu sistema"
        ]

    };


    const info = titles[sectionId];

    if (info) {

        document.getElementById("pageTitle")
            .textContent = info[0];

        document.getElementById("pageSubtitle")
            .textContent = info[1];

    }


    // Cuando cambiamos de sección,
    // ocultamos el perfil del cliente.

    if (sectionId !== "clientsSection") {

        document
            .getElementById("clientsMain")
            .classList.remove("hidden");

        document
            .getElementById("clientProfile")
            .classList.add("hidden");

    }


    updateAll();

}


// ================= CLIENTES =================

function openClientForm() {

    document
        .getElementById("clientModal")
        .classList.add("show");

}


function closeClientForm() {

    document
        .getElementById("clientModal")
        .classList.remove("show");

}


function addClient() {

    const name =
        document
            .getElementById("clientName")
            .value
            .trim();

    const phone =
        document
            .getElementById("clientPhone")
            .value
            .trim();

    const notes =
        document
            .getElementById("clientNotes")
            .value
            .trim();


    if (!name) {

        alert("Escribe el nombre del cliente.");

        return;

    }


    const newClient = {

        id: Date.now(),

        name: name,

        phone: phone,

        notes: notes,

        visits: 0,

        spent: 0,

        // ⭐ PUNTOS INICIALES
        points: 0,

        history: []

    };


    clients.push(newClient);

    saveClients();

    renderClients();

    updateAll();


    document
        .getElementById("clientName")
        .value = "";

    document
        .getElementById("clientPhone")
        .value = "";

    document
        .getElementById("clientNotes")
        .value = "";


    closeClientForm();

}


function renderClients() {

    const container =
        document.getElementById("clientList");

    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (clients.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <span>👤</span>

                <p>
                    Todavía no tienes clientes registrados.
                </p>

            </div>

        `;

        return;

    }


    clients.forEach(client => {

        const row =
            document.createElement("div");

        row.className = "client-row";

        row.innerHTML = `

            <div
                class="client-name"
                onclick="openClientProfile(${client.id})"
            >
                ${escapeHTML(client.name)}
            </div>

            <div class="client-phone">
                ${escapeHTML(client.phone || "Sin teléfono")}
            </div>

            <div class="client-visits">
                ${client.visits}
            </div>

            <div class="points">
                ⭐ ${client.points}
            </div>

            <button
                class="delete-btn"
                onclick="deleteClient(${client.id})"
            >
                🗑
            </button>

        `;


        container.appendChild(row);

    });

}


// ================= ELIMINAR CLIENTE =================

function deleteClient(id) {

    const client =
        clients.find(c => c.id === id);

    if (!client) {
        return;
    }


    const confirmDelete =
        confirm(
            `¿Eliminar a ${client.name}?`
        );


    if (!confirmDelete) {
        return;
    }


    clients =
        clients.filter(
            client => client.id !== id
        );


    saveClients();

    renderClients();

    updateAll();

}


// ================= BUSCADOR =================

const searchInput =
    document.getElementById("searchClient");

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            const search =
                this.value
                    .toLowerCase()
                    .trim();

            const rows =
                document.querySelectorAll(
                    ".client-row"
                );


            rows.forEach(row => {

                const name =
                    row
                        .querySelector(".client-name")
                        .textContent
                        .toLowerCase();

                row.style.display =
                    name.includes(search)
                        ? "grid"
                        : "none";

            });

        }
    );

}


// ================= PERFIL CLIENTE =================

function openClientProfile(id) {

    const client =
        clients.find(
            client => client.id === id
        );


    if (!client) {
        return;
    }


    selectedClientId = id;


    document
        .getElementById("clientsMain")
        .classList.add("hidden");


    document
        .getElementById("clientProfile")
        .classList.remove("hidden");


    document
        .getElementById("profileName")
        .textContent = client.name;


    document
        .getElementById("profilePhone")
        .textContent =
            client.phone || "Sin teléfono";


    document
        .getElementById("profileAvatar")
        .textContent =
            client.name
                .charAt(0)
                .toUpperCase();


    document
        .getElementById("profileVisits")
        .textContent = client.visits;


    document
        .getElementById("profileSpent")
        .textContent =
            formatMoney(client.spent);


    document
        .getElementById("profilePoints")
        .textContent = client.points;


    document
        .getElementById("profileNotes")
        .textContent =
            client.notes || "Sin notas.";


    renderClientHistory(client);

}


function closeClientProfile() {

    selectedClientId = null;


    document
        .getElementById("clientProfile")
        .classList.add("hidden");


    document
        .getElementById("clientsMain")
        .classList.remove("hidden");


    renderClients();

}


function renderClientHistory(client) {

    const container =
        document.getElementById("clientHistory");


    container.innerHTML = "";


    if (
        !client.history ||
        client.history.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <span>✂</span>

                <p>
                    Este cliente todavía no tiene servicios.
                </p>

            </div>

        `;

        return;

    }


    client.history.forEach(history => {

        const row =
            document.createElement("div");

        row.className = "history-row";


        row.innerHTML = `

            <div class="history-service">
                ${escapeHTML(history.service)}
            </div>

            <div class="history-date">
                ${formatDate(history.date)}
            </div>

            <div class="history-price">
                ${formatMoney(history.price)}
            </div>

        `;


        container.appendChild(row);

    });

}


// ================= REGISTRAR SERVICIO =================

function registerVisit() {

    if (!selectedClientId) {

        alert("Primero selecciona un cliente.");

        return;

    }


    document
        .getElementById("visitService")
        .value = "";


    document
        .getElementById("visitPrice")
        .value = "";


    document
        .getElementById("visitModal")
        .classList.add("show");

}


function closeVisitForm() {

    document
        .getElementById("visitModal")
        .classList.remove("show");

}


// ================= GUARDAR SERVICIO =================

function saveVisit() {

    if (!selectedClientId) {
        return;
    }


    const service =
        document
            .getElementById("visitService")
            .value
            .trim();


    const price =
        Number(
            document
                .getElementById("visitPrice")
                .value
        );


    if (!service) {

        alert("Escribe el servicio realizado.");

        return;

    }


    if (isNaN(price) || price < 0) {

        alert("Ingresa un precio válido.");

        return;

    }


    const client =
        clients.find(
            client => client.id === selectedClientId
        );


    if (!client) {
        return;
    }


    // ==============================================
    // ⭐ REGLA DE FIDELIZACIÓN
    // CADA SERVICIO = 5 PUNTOS
    // ==============================================

    client.points += 5;


    // Sumamos una visita

    client.visits += 1;


    // Sumamos el dinero gastado

    client.spent += price;


    // Guardamos el servicio

    client.history.unshift({

        id: Date.now(),

        service: service,

        price: price,

        date: new Date().toISOString()

    });


    saveClients();


    closeVisitForm();


    // Actualizar perfil

    openClientProfile(client.id);


    // Actualizar todo

    updateAll();


    alert(
        `Servicio registrado correctamente.\n\n⭐ +5 puntos para ${client.name}`
    );

}


// ================= TODAS LAS VISITAS =================

function renderAllVisits() {

    const container =
        document.getElementById("allVisits");


    if (!container) {
        return;
    }


    const visits =
        getAllVisits();


    container.innerHTML = "";


    if (visits.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <span>✂</span>

                <p>
                    Todavía no hay servicios registrados.
                </p>

            </div>

        `;

        return;

    }


    visits.forEach(visit => {

        const row =
            document.createElement("div");

        row.className = "visit-row";


        row.innerHTML = `

            <div class="visit-client">
                ${escapeHTML(visit.clientName)}
            </div>

            <div class="visit-service">
                ${escapeHTML(visit.service)}
            </div>

            <div class="visit-date">
                ${formatDate(visit.date)}
            </div>

            <div class="visit-price">
                ${formatMoney(visit.price)}
            </div>

        `;


        container.appendChild(row);

    });

}


// ================= DASHBOARD =================

function updateDashboard() {

    const visits =
        getAllVisits();


    const totalGenerated =
        getTotalGenerated();


    const totalPoints =
        clients.reduce(
            (total, client) =>
                total + client.points,
            0
        );


    document
        .getElementById("dashboardClients")
        .textContent = clients.length;


    document
        .getElementById("dashboardVisits")
        .textContent = visits.length;


    document
        .getElementById("dashboardGenerated")
        .textContent =
            formatMoney(totalGenerated);


    document
        .getElementById("dashboardPoints")
        .textContent = totalPoints;


    renderRecentVisits(visits);

}


function renderRecentVisits(visits) {

    const container =
        document.getElementById(
            "dashboardRecentVisits"
        );


    container.innerHTML = "";


    const recent =
        visits.slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <span>✂</span>

                <p>
                    Aún no tienes servicios registrados.
                </p>

            </div>

        `;

        return;

    }


    recent.forEach(visit => {

        const row =
            document.createElement("div");

        row.className = "visit-row";


        row.innerHTML = `

            <div class="visit-client">
                ${escapeHTML(visit.clientName)}
            </div>

            <div class="visit-service">
                ${escapeHTML(visit.service)}
            </div>

            <div class="visit-date">
                ${formatDate(visit.date)}
            </div>

            <div class="visit-price">
                ${formatMoney(visit.price)}
            </div>

        `;


        container.appendChild(row);

    });

}


// ================= BENEFICIOS =================

function renderPointsClients() {

    const container =
        document.getElementById(
            "pointsClients"
        );


    container.innerHTML = "";


    if (clients.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <span>⭐</span>

                <p>
                    Registra clientes para comenzar.
                </p>

            </div>

        `;

        return;

    }


    const sortedClients =
        [...clients].sort(
            (a, b) => b.points - a.points
        );


    sortedClients.forEach(client => {

        const row =
            document.createElement("div");

        row.className =
            "points-client-row";


        row.innerHTML = `

            <div>

                <div class="points-client-name">
                    ${escapeHTML(client.name)}
                </div>

                <small>
                    ${client.visits} servicio(s)
                </small>

            </div>

            <div class="points-value">
                ⭐ ${client.points} puntos
            </div>

        `;


        container.appendChild(row);

    });

}


// ================= INGRESOS =================

function updateIncome() {

    const visits =
        getAllVisits();


    const totalGenerated =
        getTotalGenerated();


    const commission =
        totalGenerated *
        commissionRate /
        100;


    document
        .getElementById("totalGenerated")
        .textContent =
            formatMoney(totalGenerated);


    document
        .getElementById("myCommission")
        .textContent =
            formatMoney(commission);


    document
        .getElementById("totalServices")
        .textContent =
            visits.length;


    renderIncomeHistory(visits);

}


function renderIncomeHistory(visits) {

    const container =
        document.getElementById(
            "incomeHistory"
        );


    container.innerHTML = "";


    if (visits.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <span>💰</span>

                <p>
                    Todavía no tienes ingresos registrados.
                </p>

            </div>

        `;

        return;

    }


    visits.forEach(visit => {

        const row =
            document.createElement("div");

        row.className = "visit-row";


        const commission =
            visit.price *
            commissionRate /
            100;


        row.innerHTML = `

            <div class="visit-client">
                ${escapeHTML(visit.clientName)}
            </div>

            <div class="visit-service">
                ${escapeHTML(visit.service)}
            </div>

            <div class="visit-date">
                ${formatDate(visit.date)}
            </div>

            <div class="visit-price">
                ${formatMoney(commission)}
            </div>

        `;


        container.appendChild(row);

    });

}


// ================= CONFIGURACIÓN =================

function loadSettings() {

    document
        .getElementById("commissionInput")
        .value =
            commissionRate;

}


function saveSettings() {

    const value =
        Number(
            document
                .getElementById("commissionInput")
                .value
        );


    if (
        isNaN(value) ||
        value < 0 ||
        value > 100
    ) {

        alert(
            "El porcentaje debe estar entre 0 y 100."
        );

        return;

    }


    commissionRate = value;


    localStorage.setItem(
        "commissionRate",
        commissionRate
    );


    document
        .getElementById("settingsMessage")
        .textContent =
            "Configuración guardada correctamente.";


    updateIncome();

}


// ================= SEGURIDAD HTML =================

function escapeHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ================= ACTUALIZAR TODO =================

function updateAll() {

    renderClients();

    updateDashboard();

    renderAllVisits();

    renderPointsClients();

    updateIncome();

    loadSettings();

}


// ================= INICIAR =================

updateAll();
