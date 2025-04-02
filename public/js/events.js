class EventItem {
    constructor(date, start, end, hasEnd, img, name, selection, desc, eintritt) {
        this.date = date;
        this.name = name;
        this.desc = desc;
        this.eintritt = eintritt;
        this.selection = selection;
        this.hasEnd = hasEnd;
        this.img = img;
        this.start = start;
        this.end = end;
    }
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import {
    collection,
    getDocs,
    getFirestore,
    query,
    limit,
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDMnQr16h-2-ofKciZiJCslIVSWncxp2xM",
    authDomain: "schleglapp-dce81.firebaseapp.com",
    projectId: "schleglapp-dce81",
    storageBucket: "schleglapp-dce81.appspot.com",
    messagingSenderId: "596674561612",
    appId: "1:596674561612:web:035f933ec53eb7e6d756e9",
    measurementId: "G-3GFM2S4GH8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

var events = [];

export async function initEvents(containerId) {
    events = [];
    const now = new Date();
    
    const q1 = query(
        collection(db, "books", "2023-03", "events"),
        // limit(12)
    );
    
    const querySnapshot = await getDocs(q1);
    querySnapshot.forEach((doc) => {
        let end = doc.data().end.toDate();
        let start = doc.data().start.toDate();
        let hasEnd = doc.data().hasEnd;
        let img = doc.data().img;
        let name = doc.data().name;
        let selection = doc.data().selection;
        let date = doc.data().date.toDate();
        let desc = doc.data().desc;
        let eintritt = doc.data().eintritt;
        let showInApp = doc.data().showInApp; // Standardwert false, falls nicht definiert

        // Filtern nach Datum, selection (Für Jugendliche ODER Für Alle) und showInApp
        if (date.getTime() >= now.getTime() && 
            selection === "Für Jugendliche" && 
            showInApp === true) {
            let item = new EventItem(
                date,
                start,
                end,
                hasEnd,
                img,
                name,
                selection,
                desc,
                eintritt
            );
            events.push(item);
        }
    });

    // Sortiere Events nach Datum (aufsteigend)
    events.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Beschränke auf die ersten 2 Events
    events = events.slice(0, 2);

    displayEvents(containerId);
}

function displayEvents(containerId) {
    const eventsContainer = document.getElementById(containerId);
    if (!eventsContainer) return;
    
    eventsContainer.innerHTML = ''; // Leere Container vor dem Hinzufügen neuer Events

    if (events.length === 0) {
        eventsContainer.innerHTML = `
            <div class="no-events">
                <h3>Keine anstehenden Events</h3>
            </div>
        `;
        return;
    }

    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        
        eventCard.innerHTML = `
            <div class="event-image">
                <img src="${event.img}" alt="${event.name}">
            </div>
            <div class="event-info">
                <h3>${event.name}</h3>
                <p class="event-date">
                    ${event.date.toLocaleDateString('de-DE', dateOptions)}
                </p>
                <p class="event-time">
                    ${event.start.toLocaleTimeString('de-DE', timeOptions)} Uhr
                    ${event.hasEnd ? ' - ' + event.end.toLocaleTimeString('de-DE', timeOptions) + ' Uhr' : ''}
                </p>
            </div>
        `;
        
        eventsContainer.appendChild(eventCard);
    });
} 