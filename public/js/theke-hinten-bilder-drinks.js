// drinksList für theke-hinten-bilder.html: nur zwei Spalten
(function() {
    // Warte, bis drinks geladen wurden
    const origDisplayDrinks = window.displayDrinks;
    window.displayDrinks = function(drinks) {
        // Prüfe, ob wir auf der Bilder-Seite sind
        if (!window.location.pathname.includes('theke-hinten-bilder')) {
            origDisplayDrinks(drinks);
            return;
        }
        // drinksList-Container
        const drinksList = document.getElementById('drinksList');
        drinksList.innerHTML = '';
        // Container für die Getränke
        const drinksContainer = document.createElement('div');
        drinksContainer.className = 'drinks-container';
        drinksList.appendChild(drinksContainer);
        // Container für die Spalten
        const rowContainer = document.createElement('div');
        rowContainer.className = 'drinks-row';
        drinksContainer.appendChild(rowContainer);
        // Erstelle zwei Spalten
        const columns = [
            document.createElement('div'),
            document.createElement('div')
        ];
        columns.forEach((col, index) => {
            col.className = 'category-column';
            if (index === 0) col.classList.add('left-column');
            if (index === 1) col.classList.add('right-column');
            rowContainer.appendChild(col);
        });
        // Gemeinsame Logik für beide Layouts
        // Gruppiere Getränke nach Kategorien
        const drinksByCategory = {};
        const categoryOrder = new Map();
        drinks.forEach(drink => {
            if (drink.is_active && drink.category_is_visible) {
                const categoryName = drink.category_name || 'Sonstige';
                if (!drinksByCategory[categoryName]) {
                    drinksByCategory[categoryName] = [];
                    categoryOrder.set(categoryName, drink.category_sort_order || 999999);
                }
                drinksByCategory[categoryName].push(drink);
            }
        });
        // Sortiere Kategorien nach sort_order
        const sortedCategories = Object.keys(drinksByCategory).sort((a, b) => {
            const orderA = categoryOrder.get(a) || 999999;
            const orderB = categoryOrder.get(b) || 999999;
            if (orderA === orderB) {
                return a.localeCompare(b);
            }
            return orderA - orderB;
        });
        let currentColumn = 0;
        // Verteile Kategorien auf die Spalten
        sortedCategories.forEach((categoryName, index) => {
            const categoryData = drinks.find(d => d.category_name === categoryName);
            // Prüfe, ob die vorherige Kategorie einen Spaltenumbruch erzwingt
            if (index > 0) {
                const prevCategoryData = drinks.find(d => d.category_name === sortedCategories[index - 1]);
                if (prevCategoryData && prevCategoryData.category_force_column_break) {
                    currentColumn++;
                }
            }
            // Wenn wir die maximale Anzahl an Spalten erreicht haben, bleiben wir in der letzten Spalte
            if (currentColumn >= 2) {
                currentColumn = 1;
            }
            const categoryContainer = document.createElement('div');
            categoryContainer.className = 'category-container';
            // Kategorie-Überschrift
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            const categoryH2 = document.createElement('h2');
            categoryH2.className = 'border-bottom pb-2';
            categoryH2.textContent = categoryName;
            categoryH2.dataset.sortOrder = categoryData.category_sort_order || '999999';
            categoryHeader.appendChild(categoryH2);
            categoryContainer.appendChild(categoryHeader);
            // Container für die Getränke dieser Kategorie
            const drinksListDiv = document.createElement('div');
            drinksListDiv.className = 'drinks-list';
            categoryContainer.appendChild(drinksListDiv);
            // Getränke der Kategorie
            drinksByCategory[categoryName].forEach(drink => {
                const drinkElement = document.createElement('div');
                drinkElement.setAttribute('data-drink-id', drink.id);
                const preis = parseFloat(drink.preis) || 0;
                let priceHtml = '';
                if (drink.category_show_prices && drink.show_price) {
                    priceHtml = `<span class="float-end">${formatPrice(preis)} €</span>`;
                }
                drinkElement.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title d-flex justify-content-between mb-0">
                                <span class="drink-name">
                                    ${drink.name}
                                    ${drink.additives ? `<small class="additives-info">(${drink.additives.split(', ').map(a => a.split(')')[0]).join(',')})</small>` : ''}
                                </span>
                                ${priceHtml}
                            </h5>
                        </div>
                    </div>
                `;
                drinksListDiv.appendChild(drinkElement);
            });
            // Füge die Kategorie zur entsprechenden Spalte hinzu
            columns[currentColumn].appendChild(categoryContainer);
        });
        // Logo ggf. nachladen
        if (typeof fetchLogo === 'function') fetchLogo();
    };
})(); 