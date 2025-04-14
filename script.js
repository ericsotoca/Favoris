/* --- JAVASCRIPT --- */

// Modèle de données
let bookmarks = [];
let folders = [];
let editIndex = -1;

// 10 dossiers par défaut
const DEFAULT_FOLDERS = [
    "Perso", "Travail", "Loisirs", "Outils", "Réseaux", "Actualités", "Apprentissage", "Shopping", "Projets", "Divers"
];

/**
 * Met à jour les sélecteurs de dossiers (formulaire et filtre)
 */
function updateFolderSelectors() {
    // Formulaire d'ajout/édition
    const folderSelect = document.getElementById('folder');
    if (folderSelect) {
        folderSelect.innerHTML = '';
        folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder;
            option.textContent = folder;
            folderSelect.appendChild(option);
        });
    }
    // Filtre dossiers
    const folderFilter = document.getElementById('folderFilter');
    if (folderFilter) {
        const current = folderFilter.value;
        folderFilter.innerHTML = '<option value="">Tous les dossiers</option>';
        folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder;
            option.textContent = folder;
            folderFilter.appendChild(option);
        });
        if (current && folders.includes(current)) {
            folderFilter.value = current;
        }
    }
}

// Affichage des messages de feedback
function showFeedback(message, type = "info") {
    const feedback = document.getElementById('feedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = type;
    feedback.style.display = "block";
    if (type === "error") {
        feedback.style.color = "#e74c3c";
    } else if (type === "success") {
        feedback.style.color = "#2ecc71";
    } else {
        feedback.style.color = "";
    }
    clearTimeout(showFeedback._timeout);
    showFeedback._timeout = setTimeout(() => {
        feedback.textContent = "";
        feedback.style.display = "none";
    }, 4000);
}

// Au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadBookmarks();
    renderBookmarks();
    updateTagList();
    updateFolderSelectors();
    renderFoldersList();
    setupEventListeners();
    // Vérifier le mode préféré au chargement
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').innerHTML = '☀️';
    }
    // Vérifier la vue préférée
    if (localStorage.getItem('viewMode') === 'grid') {
        document.getElementById('bookmarksList').classList.add('grid-view');
        document.getElementById('viewToggle').textContent = 'Vue en liste';
    }
    // Enregistrement du service worker pour PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then(reg => {
                    // Service worker registered
                })
                .catch(err => {
                    console.error('Service Worker registration failed:', err);
                    updateFolderSelectors();
                });
        });
    }
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Bouton Enregistrer
    document.getElementById('saveBtn').addEventListener('click', saveBookmark);

    // Recherche et filtres
    document.getElementById('search').addEventListener('input', renderBookmarks);
    document.getElementById('tagFilter').addEventListener('change', renderBookmarks);
    const folderFilter = document.getElementById('folderFilter');
    if (folderFilter) {
        folderFilter.addEventListener('change', renderBookmarks);
    }

    // Import/Export
    document.getElementById('exportBtn').addEventListener('click', exportBookmarks);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importBookmarks);

    // Tout effacer
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            showConfirm('Êtes-vous sûr de vouloir supprimer tous les favoris ?', () => {
                bookmarks = [];
                saveToStorage();
                renderBookmarks();
                updateTagList();
                updateFolderSelectors();
                showFeedback('Tous les favoris ont été supprimés.', 'success');
            });
        });
    }

    // Mode sombre
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

    // Vue grille/liste
    document.getElementById('viewToggle').addEventListener('click', toggleView);

    // Statistiques
    document.getElementById('statsBtn').addEventListener('click', showStats);

    // Sauvegarde Gist
    document.getElementById('backupBtn').addEventListener('click', backupToGist);

    // Raccourcis clavier
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === 'n') {
            e.preventDefault();
            document.getElementById('title').focus();
            // Si aucun favori, ajouter des exemples répartis dans les dossiers
            if (bookmarks.length === 0) {
                const sampleBookmarks = [
                    { title: "Google", url: "https://www.google.com", tags: ["recherche"], description: "Moteur de recherche", folder: folders[0] },
                    { title: "YouTube", url: "https://www.youtube.com", tags: ["vidéo"], description: "Plateforme vidéo", folder: folders[1] },
                    { title: "Wikipedia", url: "https://fr.wikipedia.org", tags: ["savoir"], description: "Encyclopédie libre", folder: folders[2] },
                    { title: "GitHub", url: "https://github.com", tags: ["code"], description: "Hébergement de code", folder: folders[3] },
                    { title: "Le Monde", url: "https://www.lemonde.fr", tags: ["actualité"], description: "Journal français", folder: folders[4] },
                    { title: "LinkedIn", url: "https://www.linkedin.com", tags: ["pro"], description: "Réseau professionnel", folder: folders[5] },
                    { title: "Amazon", url: "https://www.amazon.fr", tags: ["shopping"], description: "E-commerce", folder: folders[6] },
                    { title: "Stack Overflow", url: "https://stackoverflow.com", tags: ["dev"], description: "Questions/réponses dev", folder: folders[7] },
                    { title: "Twitter", url: "https://twitter.com", tags: ["social"], description: "Réseau social", folder: folders[8] },
                    { title: "Coursera", url: "https://www.coursera.org", tags: ["apprentissage"], description: "Cours en ligne", folder: folders[9] }
                ];
                bookmarks = sampleBookmarks.map(b => ({
                    ...b,
                    date: new Date().toISOString(),
                    pinned: false,
                    visits: []
                }));
                saveToStorage();
            }
        }
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            saveBookmark();
        }
        if (e.altKey && e.key === 'f') {
            e.preventDefault();
            document.getElementById('search').focus();
        }
        if (e.key === 'Escape') {
            resetForm();
            editIndex = -1;
            document.getElementById('saveBtn').textContent = 'Enregistrer';
        }
    });
}

// Charger les favoris du localStorage
function loadBookmarks() {
    // Charger les dossiers
    const savedFolders = localStorage.getItem('folders');
    if (savedFolders) {
        try {
            folders = JSON.parse(savedFolders);
        } catch (e) {
            folders = [...DEFAULT_FOLDERS];
        }
    } else {
        folders = [...DEFAULT_FOLDERS];
    }

    // Charger les favoris
    const saved = localStorage.getItem('bookmarks');
    if (saved) {
        try {
            bookmarks = JSON.parse(saved);
        } catch (e) {
            console.error("Erreur lors du chargement des favoris:", e);
            bookmarks = [];
        }
    }

    // Migration : attribuer un dossier si manquant
    if (bookmarks.length > 0 && bookmarks[0] && !('folder' in bookmarks[0])) {
        for (let i = 0; i < bookmarks.length; i++) {
            bookmarks[i].folder = folders[i % folders.length];
        }
        saveToStorage();
    }
}

// Sauvegarder les favoris dans localStorage
function saveToStorage() {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    localStorage.setItem('folders', JSON.stringify(folders));
}

// Ajouter ou modifier un favori
function saveBookmark() {
    const titleInput = document.getElementById('title');
    const urlInput = document.getElementById('url');
    const tagsInput = document.getElementById('tags');
    const descriptionInput = document.getElementById('description');
    
    // Validation avancée
    if (!titleInput.value || !urlInput.value) {
        showFeedback('Le titre et l\'URL sont obligatoires!', 'error');
        return;
    }
    // Validation d'URL avancée
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
    if (!urlPattern.test(urlInput.value.trim())) {
        showFeedback('URL invalide. Veuillez saisir une URL correcte (ex: https://exemple.com)', 'error');
        urlInput.focus();
        return;
    }
    
    // Créer l'objet favori
    const bookmark = {
        title: titleInput.value,
        url: formatUrl(urlInput.value),
        tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        description: descriptionInput.value || '',
        date: new Date().toISOString(),
        pinned: editIndex >= 0 ? bookmarks[editIndex].pinned || false : false,
        visits: editIndex >= 0 ? bookmarks[editIndex].visits || [] : []
    };
    
    // Mode édition ou ajout
    if (editIndex >= 0) {
        bookmarks[editIndex] = bookmark;
        editIndex = -1;
        document.getElementById('saveBtn').textContent = 'Enregistrer';
    } else {
        bookmarks.push(bookmark);
    }
    
    // Sauvegarder, réinitialiser et rafraîchir
    saveToStorage();
    resetForm();
    renderBookmarks();
    updateTagList();
}

// Formater l'URL pour s'assurer qu'elle contient http:// ou https://
function formatUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return 'https://' + url;
    }
    return url;
}

// Réinitialiser le formulaire
function resetForm() {
    document.getElementById('title').value = '';
    document.getElementById('url').value = '';
    document.getElementById('tags').value = '';
    document.getElementById('description').value = '';
}

// Afficher les favoris
function renderBookmarks() {
    const bookmarksList = document.getElementById('bookmarksList');
    const noBookmarks = document.getElementById('noBookmarks');
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const tagFilter = document.getElementById('tagFilter').value;
    const folderFilter = document.getElementById('folderFilter') ? document.getElementById('folderFilter').value : "";

    // Filtrer les favoris
    const filteredBookmarks = bookmarks.filter(bookmark => {
        const matchesSearch = bookmark.title.toLowerCase().includes(searchTerm) ||
            bookmark.url.toLowerCase().includes(searchTerm) ||
            bookmark.description.toLowerCase().includes(searchTerm) ||
            bookmark.tags.some(tag => tag.toLowerCase().includes(searchTerm));

        const matchesTag = !tagFilter || bookmark.tags.includes(tagFilter);
        const matchesFolder = !folderFilter || bookmark.folder === folderFilter;

        return matchesSearch && matchesTag && matchesFolder;
    });

    // Trier pour afficher les épinglés en premier
    filteredBookmarks.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
    });

    // Vider la liste existante
    while (bookmarksList.firstChild) {
        bookmarksList.removeChild(bookmarksList.firstChild);
    }
    
    // Affiche les dossiers sur la page d'accueil
    function renderFoldersList() {
        const foldersList = document.getElementById('foldersList');
        if (!foldersList) return;
        foldersList.innerHTML = '';
        const current = document.getElementById('folderFilter') ? document.getElementById('folderFilter').value : '';
        folders.forEach(folder => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.textContent = folder;
            btn.style.margin = "0.5rem";
            btn.style.background = (current === folder) ? "#3498db" : "#ecf0f1";
            btn.style.color = (current === folder) ? "#fff" : "#2c3e50";
            btn.onclick = () => {
                const folderFilter = document.getElementById('folderFilter');
                if (folderFilter) {
                    folderFilter.value = folder;
                    renderBookmarks();
                    renderFoldersList();
                }
            };
            foldersList.appendChild(btn);
        });
        // Bouton "Tous les dossiers"
        const allBtn = document.createElement('button');
        allBtn.className = 'btn';
        allBtn.textContent = "Tous les dossiers";
        allBtn.style.margin = "0.5rem";
        allBtn.style.background = (!current) ? "#3498db" : "#ecf0f1";
        allBtn.style.color = (!current) ? "#fff" : "#2c3e50";
        allBtn.onclick = () => {
            const folderFilter = document.getElementById('folderFilter');
            if (folderFilter) {
                folderFilter.value = "";
                renderBookmarks();
                renderFoldersList();
            }
            renderFoldersList;
        };
        foldersList.insertBefore(allBtn, foldersList.firstChild);
    }

    // Afficher un message si aucun favori
    if (filteredBookmarks.length === 0) {
        bookmarksList.appendChild(noBookmarks);
        return;
    }

    // Drag-and-drop state
    let dragSrcIndex = null;

    // Générer les éléments de la liste
    filteredBookmarks.forEach((bookmark, index) => {
        const li = document.createElement('li');
        li.className = 'bookmark-item';
        li.setAttribute('draggable', 'true');
        li.setAttribute('aria-grabbed', 'false');
        li.dataset.index = index;

        // Ajouter une miniature
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=64`;

        li.innerHTML = `
            <div class="bookmark-info">
                <img src="${faviconUrl}" class="bookmark-thumbnail" alt="${bookmark.title}" width="64" height="64">
                <div>
                    <div class="bookmark-tags">
                        ${bookmark.tags.map(tag => `<span class="bookmark-tag">${tag}</span>`).join('')}
                    </div>
                    <div class="bookmark-title">${bookmark.title}</div>
                    <div class="bookmark-folder" style="font-size:0.9em;color:#888;">${bookmark.folder ? "📁 " + bookmark.folder : ""}</div>
                    <a href="${bookmark.url}" target="_blank" class="bookmark-url">${bookmark.url}</a>
                    ${bookmark.description ? `<div class="bookmark-desc">${bookmark.description}</div>` : ''}
                    ${bookmark.visits?.length ? `<div class="bookmark-visits">Dernière visite : ${new Date(bookmark.visits[bookmark.visits.length - 1]).toLocaleString()}</div>` : ''}
                </div>
            </div>
            <div class="bookmark-actions">
                <button class="action-btn pin-btn" data-index="${bookmarks.indexOf(bookmark)}">${bookmark.pinned ? '📌' : '📍'}</button>
                <button class="action-btn edit-btn" data-index="${bookmarks.indexOf(bookmark)}">✏️</button>
                <button class="action-btn delete-btn" data-index="${bookmarks.indexOf(bookmark)}">🗑️</button>
            </div>
        `;

        // Drag-and-drop events
        li.addEventListener('dragstart', function (e) {
            dragSrcIndex = index;
            li.style.opacity = '0.5';
            li.setAttribute('aria-grabbed', 'true');
            e.dataTransfer.effectAllowed = 'move';
        });
        li.addEventListener('dragend', function () {
            li.style.opacity = '';
            li.setAttribute('aria-grabbed', 'false');
        });
        li.addEventListener('dragover', function (e) {
            e.preventDefault();
            li.style.border = '2px dashed #3498db';
        });
        li.addEventListener('dragleave', function () {
            li.style.border = '';
        });
        li.addEventListener('drop', function (e) {
            e.preventDefault();
            li.style.border = '';
            if (dragSrcIndex !== null && dragSrcIndex !== index) {
                // Reorder bookmarks array
                const realIndex = bookmarks.indexOf(filteredBookmarks[dragSrcIndex]);
                const targetIndex = bookmarks.indexOf(filteredBookmarks[index]);
                const [moved] = bookmarks.splice(realIndex, 1);
                bookmarks.splice(targetIndex, 0, moved);
                saveToStorage();
                renderBookmarks();
                showFeedback('Favoris réorganisés.', 'success');
            }
            
            // Mettre à jour les sélecteurs de dossiers (formulaire et filtre)
            function updateFolderSelectors() {
                // Formulaire d'ajout/édition
                const folderSelect = document.getElementById('folder');
                if (folderSelect) {
                    folderSelect.innerHTML = '';
                    folders.forEach(folder => {
                        const option = document.createElement('option');
                        option.value = folder;
                        option.textContent = folder;
                        folderSelect.appendChild(option);
                    });
                }
                // Filtre dossiers
                const folderFilter = document.getElementById('folderFilter');
                if (folderFilter) {
                    const current = folderFilter.value;
                    folderFilter.innerHTML = '<option value="">Tous les dossiers</option>';
                    folders.forEach(folder => {
                        const option = document.createElement('option');
                        option.value = folder;
                        option.textContent = folder;
                        folderFilter.appendChild(option);
                    });
                    if (current && folders.includes(current)) {
                        folderFilter.value = current;
                    }
                }
            }
            dragSrcIndex = null;
        });

        bookmarksList.appendChild(li);

        // Ajouter un écouteur pour suivre les visites
        li.querySelector('.bookmark-url').addEventListener('click', () => {
            trackVisit(bookmarks.indexOf(bookmark));
        });
    });

    // Ajouter les écouteurs d'événements pour les boutons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', editBookmark);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteBookmark);
    });

    document.querySelectorAll('.pin-btn').forEach(btn => {
        btn.addEventListener('click', togglePin);
    });
}

// Suivre les visites
function trackVisit(bookmarkIndex) {
    if (!bookmarks[bookmarkIndex].visits) {
        bookmarks[bookmarkIndex].visits = [];
        updateFolderSelectors();
    }
    bookmarks[bookmarkIndex].visits.push(new Date().toISOString());
    if (bookmarks[bookmarkIndex].visits.length > 10) {
        bookmarks[bookmarkIndex].visits.shift();
    }
    saveToStorage();
    renderBookmarks();
}

// Basculer l'épinglage
function togglePin(e) {
    const index = parseInt(e.target.dataset.index);
    bookmarks[index].pinned = !bookmarks[index].pinned;
    saveToStorage();
    renderBookmarks();
}

// Éditer un favori
function editBookmark(e) {
    const index = parseInt(e.target.dataset.index);
    const bookmark = bookmarks[index];
    
    document.getElementById('title').value = bookmark.title;
    document.getElementById('url').value = bookmark.url;
    document.getElementById('tags').value = bookmark.tags.join(', ');
    document.getElementById('description').value = bookmark.description || '';
    
    editIndex = index;
    document.getElementById('saveBtn').textContent = 'Mettre à jour';
    
    document.querySelector('.form-group').scrollIntoView({ behavior: 'smooth' });
}

// Supprimer un favori
function showConfirm(message, onConfirm) {
    const modal = document.getElementById('modal');
    if (!modal) return;
    modal.innerHTML = `
        <div class="modal-content" style="background:white;padding:2rem;border-radius:8px;max-width:400px;width:90%;box-shadow:0 2px 10px rgba(0,0,0,0.1);text-align:center;">
            <p style="margin-bottom:2rem;">${message}</p>
            <button id="confirmYes" class="btn btn-danger" style="margin-right:1rem;">Oui</button>
            <button id="confirmNo" class="btn btn-secondary">Non</button>
        </div>
    `;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    document.getElementById('confirmYes').focus();

    function cleanup() {
        modal.style.display = "none";
        modal.innerHTML = "";
        document.body.style.overflow = "";
    }

    document.getElementById('confirmYes').onclick = () => {
        cleanup();
        if (typeof onConfirm === "function") onConfirm();
    };
    document.getElementById('confirmNo').onclick = cleanup;
    modal.onclick = function(e) {
        if (e.target === modal) cleanup();
    };
    document.addEventListener('keydown', function escListener(e) {
        if (e.key === "Escape") {
            cleanup();
            document.removeEventListener('keydown', escListener);
        }
    });
}

function deleteBookmark(e) {
    const index = parseInt(e.target.dataset.index);
    showConfirm('Êtes-vous sûr de vouloir supprimer ce favori ?', () => {
        bookmarks.splice(index, 1);
        saveToStorage();
        renderBookmarks();
        updateTagList();
        showFeedback('Favori supprimé.', 'success');
    });
}

// Mettre à jour la liste des tags
function updateTagList() {
    const tags = [...new Set(bookmarks.flatMap(bookmark => bookmark.tags))].sort();
    
    // Mettre à jour la datalist
    const datalist = document.getElementById('tagList');
    datalist.innerHTML = '';
    
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        datalist.appendChild(option);
    });
    
    // Mettre à jour le filtre de tags
    const tagFilter = document.getElementById('tagFilter');
    const currentSelection = tagFilter.value;
    
    tagFilter.innerHTML = '<option value="">Tous les tags</option>';
    
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });
    
    if (currentSelection && tags.includes(currentSelection)) {
        tagFilter.value = currentSelection;
    }
}

// Exporter les favoris
function exportBookmarks() {
    if (bookmarks.length === 0) {
        showFeedback('Aucun favori à exporter !', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(bookmarks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'mes_favoris_' + new Date().toISOString().slice(0, 10) + '.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Importer des favoris
function importBookmarks(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        let content = e.target.result;
        // Try JSON first
        try {
            const importedBookmarks = JSON.parse(content);
            if (Array.isArray(importedBookmarks)) {
                showConfirm(`Importer ${importedBookmarks.length} favoris ? Cela remplacera vos favoris actuels.`, () => {
                    // Filtrer uniquement les favoris avec une URL valide (http/https)
                    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
                    bookmarks = importedBookmarks.filter(b =>
                        typeof b.url === "string" &&
                        urlPattern.test(b.url.trim()) &&
                        !b.url.trim().toLowerCase().startsWith("javascript:")
                    );
                    saveToStorage();
                    renderBookmarks();
                    updateTagList();
                    showFeedback('Importation réussie !', 'success');
                });
                return;
            }
        } catch (error) {
            // Not JSON, try HTML
        }

        // Try to parse as HTML (Chrome bookmarks)
        if (content.includes('<!DOCTYPE NETSCAPE-Bookmark-file-1') || content.includes('<DT><A')) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                const links = doc.querySelectorAll('a');
                const importedBookmarks = [];
                links.forEach(link => {
                    importedBookmarks.push({
                        title: link.textContent,
                        url: link.getAttribute('href'),
                        tags: [],
                        description: link.getAttribute('add_date') ? `Ajouté le ${new Date(Number(link.getAttribute('add_date')) * 1000).toLocaleDateString()}` : '',
                        date: new Date().toISOString(),
                        pinned: false,
                        visits: []
                    });
                });
                // Filtrer uniquement les liens avec une URL http(s) valide
                const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
                const filteredBookmarks = importedBookmarks.filter(b =>
                    typeof b.url === "string" &&
                    urlPattern.test(b.url.trim()) &&
                    !b.url.trim().toLowerCase().startsWith("javascript:")
                );
                if (filteredBookmarks.length > 0) {
                    showConfirm(`Importer ${filteredBookmarks.length} favoris HTML ? Cela remplacera vos favoris actuels.`, () => {
                        bookmarks = filteredBookmarks;
                        saveToStorage();
                        renderBookmarks();
                        updateTagList();
                        showFeedback('Importation HTML réussie !', 'success');
                    });
                } else {
                    showFeedback('Aucun favori valide trouvé dans le fichier HTML.', 'error');
                }
            } catch (err) {
                console.error('Erreur lors de l\'importation HTML :', err);
                showFeedback('Erreur lors de l\'importation du fichier HTML.', 'error');
            }
        } else {
            showFeedback('Le fichier importé n\'est ni un JSON ni un HTML de favoris Chrome.', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// Basculer le mode sombre
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    document.getElementById('darkModeToggle').innerHTML = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

// Basculer la vue grille/liste
function toggleView() {
    const bookmarksList = document.getElementById('bookmarksList');
    bookmarksList.classList.toggle('grid-view');
    document.getElementById('viewToggle').textContent = bookmarksList.classList.contains('grid-view') ? 'Vue en liste' : 'Vue en grille';
    localStorage.setItem('viewMode', bookmarksList.classList.contains('grid-view') ? 'grid' : 'list');
}

// Afficher les statistiques
function showStats() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    const totalBookmarks = bookmarks.length;
    const tagCounts = {};
    bookmarks.forEach(b => {
        b.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
    const mostVisited = [...bookmarks].sort((a, b) => 
        (b.visits?.length || 0) - (a.visits?.length || 0)
    ).slice(0, 5);
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Statistiques</h2>
            <p>Nombre total de favoris: ${totalBookmarks}</p>
            <h3>Par tag:</h3>
            <ul>${Object.entries(tagCounts).map(([tag, count]) => 
                `<li>${tag}: ${count} (${Math.round(count/totalBookmarks*100)}%)</li>`
            ).join('')}</ul>
            <h3>Les plus visités:</h3>
            <ol>${mostVisited.map(b => 
                `<li>${b.title} (${b.visits?.length || 0} visites)</li>`
            ).join('')}</ol>
            <button class="btn btn-primary" onclick="this.parentNode.parentNode.remove()">Fermer</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Sauvegarde sur GitHub Gist
async function backupToGist() {
    const token = prompt("Entrez votre token GitHub avec permission gist:");
    if (!token) return;
    
    try {
        const response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: "Sauvegarde de mes favoris",
                public: false,
                files: {
                    "bookmarks_backup.json": {
                        content: JSON.stringify(bookmarks)
                    }
                }
            })
        });
        
        const data = await response.json();
        if (data.html_url) {
            showFeedback(`Sauvegarde réussie! URL: ${data.html_url}`, 'success');
        } else {
            showFeedback("Erreur lors de la sauvegarde: " + JSON.stringify(data), 'error');
        }
    } catch (error) {
        showFeedback("Erreur lors de la sauvegarde: " + error.message, 'error');
    }
}