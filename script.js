document.addEventListener('DOMContentLoaded', () => {
    // Vues principales
    const welcomePage = document.getElementById('welcomePage');
    const formPage = document.getElementById('formPage');
    const recapPage = document.getElementById('recapPage');
    const allPageViews = document.querySelectorAll('.page-view');

    // Éléments de l'accueil
    const startFormBtn = document.getElementById('startFormBtn');

    // Éléments du formulaire
    const formContent = formPage.querySelector('.form-content'); // Cibler à l'intérieur de formPage
    const questionPages = Array.from(formContent.querySelectorAll(':scope > .question-page'));
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const viewRecapBtn = document.getElementById('viewRecapBtn');
    const progressBar = document.getElementById('progressBar');
    const stepIndicator = document.getElementById('stepIndicator');

    // Éléments du récapitulatif
    const recapContainer = recapPage.querySelector('.recap-container'); // Pour s'assurer de cibler dans la bonne page
    const editRecapBtnTop = document.getElementById('editRecapBtnTop');
    const recapTagline = document.getElementById('recapTagline');
    const sendingStatusDiv = document.getElementById('sendingStatus');
    const sendingStatusText = document.getElementById('sendingStatusText');
    const recapContentDiv = document.getElementById('recapContent'); // Renommé pour éviter conflit avec formContent
    const recapNavigationFooter = document.getElementById('recapNavigationFooter');
    const sendRecapBtn = document.getElementById('sendRecapBtn');

    // Footer permanent
    const siteFooter = document.getElementById('siteFooter');
    const currentYearSpan = document.getElementById('currentYear');

    let currentStep = 0;
    const totalSteps = questionPages.length;
    let formData = {};

    // --- FONCTIONS DE NAVIGATION ENTRE VUES PRINCIPALES ---
    function showView(viewToShow) {
        allPageViews.forEach(view => {
            view.classList.remove('active-view');
            view.style.display = 'none'; // Assurer que display:none est appliqué
        });
        viewToShow.style.display = 'block'; // Forcer l'affichage avant d'ajouter la classe pour l'animation
        // Délai court pour permettre au navigateur de traiter display:block avant l'animation
        setTimeout(() => {
            viewToShow.classList.add('active-view');
        }, 10); 
        window.scrollTo(0, 0);
        // Assurer que le footer du site est toujours visible
        siteFooter.style.display = 'block';
    }
    

    // --- INITIALISATION ---
    function initialize() {
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
        showView(welcomePage); // Afficher la page d'accueil au démarrage
        
        if (totalSteps > 0) {
            updateFormDisplay(); // Initialiser l'affichage du formulaire (1ère question)
        } else {
            console.error("Aucune page de question (.question-page) n'a été trouvée.");
            if(formContent) formContent.innerHTML = "<p>Erreur: Contenu du formulaire introuvable.</p>";
        }
    }

    // --- NAVIGATION DANS LE FORMULAIRE DE QUESTIONS ---
    function updateFormDisplay() {
        if (questionPages.length === 0) return;

        questionPages.forEach((page, index) => {
            page.classList.toggle('active', index === currentStep);
        });

        const progressPercentage = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
        progressBar.style.width = `${progressPercentage}%`;
        stepIndicator.textContent = `Étape ${currentStep + 1} sur ${totalSteps}`;

        prevBtn.disabled = currentStep === 0;
        
        if (currentStep === totalSteps - 1) {
            nextBtn.style.display = 'none';
            viewRecapBtn.style.display = 'inline-flex'; // Utiliser inline-flex car les boutons l'utilisent
        } else {
            nextBtn.style.display = 'inline-flex';
            viewRecapBtn.style.display = 'none';
            nextBtn.disabled = false; 
        }
    }

    // --- COLLECTE DES DONNÉES (identique à la version précédente, vérifier les sélecteurs si besoin) ---
    function collectDataFromCurrentStep() {
        if (currentStep >= totalSteps || currentStep < 0) return; // Sécurité
        const currentPage = questionPages[currentStep];
        if (!currentPage) return;

        const inputs = currentPage.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea, input[type="radio"]:checked, input[type="checkbox"]'); // Changé pour prendre TOUS les checkboxes, cochés ou non pour pouvoir les retirer
        
        inputs.forEach(input => {
            const name = input.name;
            if (!name) return; // Ignorer les inputs sans nom

            if (input.type === 'checkbox') {
                if (!formData[name]) formData[name] = [];
                
                // Gérer la suppression si décoché et existant
                const valueIndex = formData[name].indexOf(input.value);
                if (input.checked && valueIndex === -1) {
                    formData[name].push(input.value);
                } else if (!input.checked && valueIndex !== -1) {
                    formData[name].splice(valueIndex, 1);
                }
            } else if (input.type === 'radio') {
                if (input.checked) { // Seulement si coché pour les radios
                    formData[name] = input.value;
                }
            } else { // text, email, textarea, etc.
                if (input.value.trim() !== '') {
                    formData[name] = input.value.trim();
                } else {
                    delete formData[name]; 
                }
            }

            // Gestion spécifique des champs "autre" texte liés
            if ((input.type === 'radio' || input.type === 'checkbox') && input.value.startsWith('other_') && input.checked) {
                const otherTextInputName = name + "_other_text"; // Convention: project_type_other_text pour project_type=other_project_type
                const otherTextInput = currentPage.querySelector(`input[type="text"][name="${otherTextInputName}"]`);
                if (otherTextInput && otherTextInput.value.trim() !== '') {
                    formData[name + "_detail"] = otherTextInput.value.trim(); 
                } else {
                    delete formData[name + "_detail"]; // Supprimer si vide
                }
            }
        });
       // console.log('Form Data Updated:', formData);
    }


    // --- VALIDATION (identique, vérifier les sélecteurs si besoin) ---
// Dans script.js

// ... (Début de votre script.js, sélecteurs, etc.) ...

    // --- VALIDATION ---
    function validateCurrentStep() {
        if (currentStep >= totalSteps || currentStep < 0) return true;
        const currentPage = questionPages[currentStep];
        if (!currentPage) return true;

        let isValid = true;
        let firstInvalidField = null;

        // Réinitialiser les messages d'erreur spécifiques (comme pour l'email)
        const emailErrorSpan = document.getElementById('emailErrorMessage');
        if (emailErrorSpan) emailErrorSpan.textContent = '';


        const requiredFields = currentPage.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.classList.remove('invalid'); // Retirer la classe 'invalid' au début
            field.style.borderColor = ''; // Reset style de bordure CSS direct (si utilisé avant)
            
            // Vider les messages d'erreur génériques (si vous en ajoutez d'autres)
            const siblingError = field.nextElementSibling;
            if (siblingError && siblingError.classList.contains('error-message') && siblingError.id !== 'emailErrorMessage') {
                siblingError.textContent = '';
            }


            if (field.type === 'radio' || field.type === 'checkbox') {
                const groupName = field.name;
                const groupChecked = currentPage.querySelector(`input[name="${groupName}"]:checked`);
                if (!groupChecked) {
                    isValid = false;
                    if (!firstInvalidField) firstInvalidField = field;
                    const optionsContainer = field.closest('.options-container');
                    if (optionsContainer) optionsContainer.style.border = '2px dashed var(--primary-color)';
                } else {
                    const optionsContainer = field.closest('.options-container');
                    if (optionsContainer) optionsContainer.style.border = 'none';
                }
            } else { // text, email, textarea, etc.
                if (field.value.trim() === '') {
                    isValid = false;
                    field.classList.add('invalid');
                    if (!firstInvalidField) firstInvalidField = field;
                } else {
                    field.classList.remove('invalid');
                }

                // Validation spécifique pour le champ email
                if (field.name === 'contact_email' && field.value.trim() !== '') {
                    // Expression régulière simple pour vérifier le format de l'email
                    // Basée sur le type="email" mais un peu plus explicite pour le message d'erreur
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(field.value.trim())) {
                        isValid = false;
                        field.classList.add('invalid');
                        if (emailErrorSpan) {
                            emailErrorSpan.textContent = 'Veuillez entrer une adresse e-mail valide (ex: nom@domaine.com).';
                        }
                        if (!firstInvalidField) firstInvalidField = field;
                    } else {
                        if (emailErrorSpan) emailErrorSpan.textContent = ''; // Effacer si valide
                        // field.classList.remove('invalid'); // Déjà fait au-dessus si non vide
                    }
                }
            }
        });
        
        // Validation spécifique pour les groupes de radios non marqués 'required' mais implicitement obligatoires
        if (currentStep === 0) { 
            const projectTypeRadios = currentPage.querySelectorAll('input[name="project_type"]');
            const projectTypeSelected = currentPage.querySelector('input[name="project_type"]:checked');
            const optionsContainer = projectTypeRadios.length > 0 ? projectTypeRadios[0].closest('.options-container') : null;
            if (projectTypeRadios.length > 0 && !projectTypeSelected) {
                isValid = false;
                if (!firstInvalidField) firstInvalidField = projectTypeRadios[0];
                if (optionsContainer) optionsContainer.style.border = '2px dashed var(--primary-color)';
                // alert('Veuillez sélectionner le type de projet.'); // L'alerte générale suffira
            } else if (optionsContainer) {
                 optionsContainer.style.border = 'none';
            }
        }

        if (!isValid) {
            if (!currentPage.querySelector('#emailErrorMessage:not(:empty)')) { // Si pas déjà un message d'erreur email spécifique
                 alert('Veuillez remplir tous les champs obligatoires (marqués d\'un *) et/ou corriger les erreurs indiquées.');
            }
            if (firstInvalidField) {
                firstInvalidField.focus();
                if (firstInvalidField.type === 'radio' || firstInvalidField.type === 'checkbox') {
                    firstInvalidField.closest('.option-item')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
        return isValid;
    }

    // --- GESTION DU RÉCAPITULATIF ---
    function generateRecap() {
        recapContentDiv.innerHTML = ''; // Vider le contenu précédent
        sendingStatusDiv.style.display = 'none'; // Cacher l'état d'envoi
        sendingStatusDiv.classList.remove('success', 'error');
        recapContentDiv.style.display = 'block'; // S'assurer que le contenu du récap est visible
        recapNavigationFooter.style.display = 'flex'; // Afficher le footer du récap (bouton envoyer)
        recapTagline.textContent = "Veuillez vérifier attentivement vos informations avant l'envoi.";

        // Construire le contenu du récap
        questionPages.forEach((page, index) => {
            const titleElement = page.querySelector('.question-title');
            // Cloner le titre pour éviter les problèmes si le titre original contient des span/highlight
            const clonedTitle = titleElement ? titleElement.cloneNode(true) : null;
            let questionTitleText = `Question ${index + 1}`;
            if (clonedTitle) {
                // Retirer les span.highlight-alt pour un texte plus propre
                clonedTitle.querySelectorAll('.highlight-alt').forEach(span => span.replaceWith(span.textContent));
                questionTitleText = clonedTitle.textContent.trim();
            }
            
            const sectionDiv = document.createElement('div');
            const h3 = document.createElement('h3');
            h3.innerHTML = questionTitleText; // Utiliser innerHTML si le titre contient des balises nettoyées
            sectionDiv.appendChild(h3);
            
            const answerList = document.createElement('ul');
            let questionHasAnswer = false;

            const inputsOnPage = Array.from(page.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea, input[type="radio"], input[type="checkbox"]'));
            const inputNamesOnPage = new Set(inputsOnPage.map(input => input.name).filter(name => name));

            inputNamesOnPage.forEach(name => {
                if (formData[name] || formData[name + "_detail"]) {
                    const value = formData[name];
                    const detailValue = formData[name + "_detail"];

                    if (Array.isArray(value) && value.length > 0) { // Checkboxes
                        questionHasAnswer = true;
                        value.forEach(cbValue => {
                            const originalInput = page.querySelector(`input[name="${name}"][value="${cbValue}"]`);
                            const labelText = originalInput?.closest('.option-item')?.querySelector('.option-text')?.innerText.replace(/\s*<small>.*/i, '').trim() || cbValue;
                            const li = document.createElement('li');
                            li.textContent = labelText;
                            answerList.appendChild(li);

                            if (cbValue.startsWith('other_') && detailValue) {
                                const detailLi = document.createElement('li');
                                detailLi.innerHTML = `  <em>Précision : ${detailValue}</em>`; // Si detailValue est un objet, il faut le cibler
                                answerList.appendChild(detailLi);
                            }
                        });
                    } else if (!Array.isArray(value) && typeof value !== 'undefined') { // Radio, text, textarea
                        questionHasAnswer = true;
                        let displayValue = value;
                        const originalInput = page.querySelector(`input[name="${name}"], textarea[name="${name}"]`);
                        if (originalInput && originalInput.type === 'radio') {
                            const radioChecked = page.querySelector(`input[name="${name}"]:checked`);
                            displayValue = radioChecked?.closest('.option-item')?.querySelector('.option-text')?.innerText.replace(/\s*<small>.*/i, '').trim() || value;
                        }
                        const li = document.createElement('li');
                        li.textContent = displayValue;
                        answerList.appendChild(li);
                        
                        if (value.startsWith('other_') && detailValue) {
                            const detailLi = document.createElement('li');
                            detailLi.innerHTML = `  <em>Précision : ${detailValue}</em>`;
                            answerList.appendChild(detailLi);
                        }
                    } else if (typeof value === 'undefined' && detailValue) { // Cas d'un champ "autre" texte seul
                        questionHasAnswer = true;
                        const li = document.createElement('li');
                        li.innerHTML = `<em>Précision (Autre) : ${detailValue}</em>`;
                        answerList.appendChild(li);
                    }
                }
            });
            
            if (questionHasAnswer) {
                sectionDiv.appendChild(answerList);
                recapContentDiv.appendChild(sectionDiv);
            }
        });
        showView(recapPage);
    }

    // --- ÉCOUTEURS D'ÉVÉNEMENTS ---
    if (startFormBtn) {
        startFormBtn.addEventListener('click', () => {
            showView(formPage);
            updateFormDisplay(); // Afficher la première question du formulaire
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            collectDataFromCurrentStep(); // Collecter AVANT de valider pour que les valeurs "autre" soient prises
            if (!validateCurrentStep()) return;
            if (currentStep < totalSteps - 1) {
                currentStep++;
                updateFormDisplay();
                window.scrollTo(0, 0);
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            // La collecte au retour arrière peut être complexe, on la laisse pour l'instant.
            // Les données sont collectées avant de passer à l'étape suivante.
            if (currentStep > 0) {
                currentStep--;
                updateFormDisplay();
                window.scrollTo(0, 0);
            }
        });
    }

    if (viewRecapBtn) {
        viewRecapBtn.addEventListener('click', () => {
            collectDataFromCurrentStep();
            if (!validateCurrentStep()) return;
            generateRecap();
        });
    }
    
    function handleEditRecap() {
        showView(formPage);
        // currentStep est déjà à la dernière étape ou celle où l'utilisateur était
        updateFormDisplay(); 
    }

    if(editRecapBtnTop) editRecapBtnTop.addEventListener('click', handleEditRecap);


// ... (début de votre script.js) ...

if (sendRecapBtn) {
    sendRecapBtn.addEventListener('click', () => {
        recapContentDiv.style.display = 'none';
        recapNavigationFooter.style.display = 'none';
        editRecapBtnTop.style.display = 'none'; 
        recapTagline.textContent = "Traitement de votre demande";

        sendingStatusDiv.style.display = 'flex';
        sendingStatusDiv.classList.remove('success', 'error');
        sendingStatusText.textContent = 'Envoi de votre brief en cours...';
        const spinnerElement = sendingStatusDiv.querySelector('.spinner');
        if (spinnerElement) spinnerElement.style.display = 'block'; // S'assurer qu'il est visible au début de l'envoi

        const formspreeEndpoint = 'https://formspree.io/f/xovwakov'; // REMPLACEZ CECI

        fetch(formspreeEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (response.ok) {
                sendingStatusDiv.classList.add('success');
                sendingStatusText.textContent = 'Merci ! Votre brief a été envoyé avec succès. Je reviens vers vous très prochainement.';
                recapTagline.textContent = "Confirmation d'envoi";
                if (spinnerElement) spinnerElement.style.display = 'none'; // <<< AJOUT ICI : Masquer le spinner
            } else {
                return response.json().then(data => Promise.reject(data)); 
            }
        })
        .catch(dataOrError => { 
            sendingStatusDiv.classList.add('error');
            let errorMessage = "Une erreur s'est produite lors de l'envoi.";
            if (dataOrError && dataOrError.errors) { 
                errorMessage = "Erreur : " + dataOrError.errors.map(e => e.message).join(", ");
            } else if (dataOrError instanceof Error) { 
                console.error('Erreur Fetch:', dataOrError);
                errorMessage = 'Une erreur réseau s\'est produite. Veuillez vérifier votre connexion.';
            }
            sendingStatusText.textContent = errorMessage + " Veuillez réessayer ou me contacter directement.";
            recapTagline.textContent = "Échec de l'envoi";
            if (spinnerElement) spinnerElement.style.display = 'none'; // <<< AJOUT ICI : Masquer le spinner
            editRecapBtnTop.style.display = 'inline-flex'; 
        });
    });
}

    // Démarrer l'application
    initialize();
});