document.getElementById('debridForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Empêche le rechargement de la page

    const linkInput = document.getElementById('linkInput');
    const responseMessage = document.getElementById('responseMessage');
    const processingStatus = document.getElementById('processingStatus');

    // Références aux éléments audio et au bouton de musique
    const backgroundMusic = document.getElementById('backgroundMusic');
    const musicToggleButton = document.getElementById('musicToggleButton');

    // *** LOGIQUE DE LECTURE MUSICALE AU CLIC DU BOUTON DE TÉLÉCHARGEMENT ***
    // Lance la musique si elle est en pause (au moment où le bouton de téléchargement est cliqué)
    if (backgroundMusic.paused) {
        backgroundMusic.play().catch(error => {
            console.error("Erreur lors de la lecture de la musique au clic sur le bouton de débridage :", error);
            // Vous pouvez afficher un message à l'utilisateur ici si la lecture est bloquée
            // Ex: alert("La lecture automatique de la musique est bloquée par le navigateur. Veuillez utiliser le bouton 'Play Music'.");
        });
        // Si le bouton de contrôle de musique dédié existe, met à jour son texte
        if (musicToggleButton) {
            musicToggleButton.textContent = 'Pause Music';
        }
    }

    // Réinitialisation des messages d'état pour le formulaire
    responseMessage.className = 'info'; // Met une classe par défaut (bleue)
    responseMessage.innerHTML = 'Traitement en cours...'; // Utilise innerHTML pour pouvoir ajouter des <p> plus tard
    processingStatus.textContent = ''; // Réinitialise le statut de traitement

    // 1. Obtenir tous les liens du textarea, diviser par ligne et filtrer les lignes vides
    const rawLinks = linkInput.value.split('\n');
    const linksToProcess = rawLinks.map(link => link.trim()).filter(link => link !== '');

    if (linksToProcess.length === 0) {
        responseMessage.className = 'error';
        responseMessage.textContent = 'Veuillez saisir au moins un lien.';
        return; // Arrête la fonction si aucun lien n'est valide
    }

    // 2. Initialisation des compteurs de progression
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    // 3. Traiter chaque lien un par un
    for (const rawLink of linksToProcess) {
        processedCount++;
        processingStatus.textContent = `Traitement du lien ${processedCount} sur ${linksToProcess.length}...`;

        let linkToDebrid = rawLink; // Utilise le lien brut de la liste pour le nettoyage

        // Appliquer la logique de nettoyage du lien
        const httpIndex = linkToDebrid.indexOf('http://');
        const httpsIndex = linkToDebrid.indexOf('https://');

        let startIndex = -1;
        if (httpIndex !== -1 && (httpsIndex === -1 || httpIndex < httpsIndex)) {
            startIndex = httpIndex;
        } else if (httpsIndex !== -1 && (httpIndex === -1 || httpsIndex < httpIndex)) {
            startIndex = httpsIndex;
        }

        if (startIndex !== -1) {
            linkToDebrid = linkToDebrid.substring(startIndex).trim();
        } else {
            linkToDebrid = ''; // Rend le lien invalide si aucune URL trouvée
        }

        // Validation finale avant l'envoi de la requête
        if (!linkToDebrid.startsWith('http://') && !linkToDebrid.startsWith('https://')) {
            responseMessage.innerHTML += '<p class="error">Erreur pour "' + rawLink + '" : Le lien n\'est pas un format d\'URL valide. Ignoré.</p>';
            errorCount++;
            continue; // Passe au lien suivant dans la boucle
        }

        // Envoi de la requête au serveur pour débrider et télécharger
        try {
            const response = await fetch('/debrid/link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ link: linkToDebrid })
            });

            const data = await response.json();

            if (response.ok) { // Vérifie si le statut HTTP est 2xx
                responseMessage.innerHTML += '<p class="success">Succès pour "' + data.filename + '" (de ' + rawLink + '). Téléchargement initié.</p>';
                successCount++;
            } else {
                responseMessage.innerHTML += '<p class="error">Erreur pour "' + rawLink + '" : ' + (data.message || 'Une erreur inconnue est survenue.') + '</p>';
                errorCount++;
            }
        } catch (error) {
            // Gère les erreurs de connexion réseau ou de serveur
            responseMessage.innerHTML += '<p class="error">Échec réseau/serveur pour "' + rawLink + '" : ' + error.message + '</p>';
            errorCount++;
        }
    }

    // 4. Nettoyage et affichage du résumé final
    linkInput.value = ''; // Efface le champ textarea après le traitement de tous les liens
    processingStatus.textContent = 'Traitement terminé : ' + successCount + ' succès, ' + errorCount + ' erreurs.';

    // Met à jour le message global basé sur les résultats
    if (successCount > 0 && errorCount === 0) {
        responseMessage.className = 'success';
        responseMessage.textContent = 'Tous les liens ont été traités avec succès !';
    } else if (successCount > 0 && errorCount > 0) {
        responseMessage.className = 'info'; // Ni succès total ni échec total
        responseMessage.textContent = 'Certains liens ont été traités avec succès, d\'autres ont échoué. Voir les détails ci-dessous.';
    } else {
        responseMessage.className = 'error';
        responseMessage.textContent = 'Aucun lien n\'a pu être traité avec succès. Voir les détails ci-dessous.';
    }
});

// *** LOGIQUE DE CONTRÔLE MUSICALE POUR LE BOUTON DÉDIÉ ***
// Cette partie permet de contrôler la musique indépendamment via le bouton "Play/Pause Music"
const backgroundMusic = document.getElementById('backgroundMusic');
const musicToggleButton = document.getElementById('musicToggleButton');
// Note: La variable 'isPlaying' est gérée par l'état `paused` de l'élément audio lui-même,
// mais elle peut être utile pour synchroniser l'état du bouton si vous avez des interactions complexes.

if (musicToggleButton) { // S'assure que le bouton existe avant d'ajouter l'écouteur
    musicToggleButton.addEventListener('click', () => {
        if (backgroundMusic.paused) { // Vérifie si la musique est en pause
            backgroundMusic.play().catch(error => {
                console.error("Erreur lors de la lecture de la musique via le bouton dédié :", error);
                // Gérer les erreurs, par exemple, afficher un message d'erreur
            });
            musicToggleButton.textContent = 'Pause Music';
        } else {
            backgroundMusic.pause();
            musicToggleButton.textContent = 'Play Music';
        }
        // Pas besoin de toggler une variable isPlaying ici si on se base directement sur backgroundMusic.paused
    });
}