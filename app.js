/* ============================================================
   ANNIV — Application JavaScript
   Fanta & Alphou | Cadeau d'anniversaire interactif
   ============================================================ */

/* ============================================================
   SECTION 1 : CONFIGURATION DU QUIZ
   👉 Alphou, modifie ici les questions, les réponses correctes
      et le code PIN si tu veux tout changer !
   ============================================================

   Le PIN final = les 4 digitRevealed dans l'ordre.
   Ici : "1", "7", "1", "0" → PIN = "1710"
   Ce qui représente le 17 octobre — l'anniversaire de Fanta 🎂
*/
const QUIZ_CONFIG = {

  // ============================================================
  // LE CODE PIN CORRECT (formé par les 4 chiffres révélés)
  // ============================================================
  correctPin: "1710",  // 17 octobre = date d'anniversaire 🎂

  // ============================================================
  // LES 4 QUESTIONS DU QUIZ
  // Pour chaque question :
  //   text         → le texte de la question
  //   options      → tableau des 4 choix (ordre libre)
  //   correctIndex → index (0-3) de la bonne réponse dans options[]
  //   digitRevealed→ le chiffre dévoilé si bonne réponse
  //   successFeedback → message affiché après bonne réponse
  // ============================================================
  questions: [
    {
      text: "En quelle classe étais-je (Alphou) lorsque nos regards se sont croisés à l'école militaire ?",
      options: ["3ème", "Terminale", "Seconde", "Première"],
      correctIndex: 2,           // "Seconde" ✓
      digitRevealed: "1",
      successFeedback: "Exact ! C'était bien ma Seconde… et toi en 5ème avec ta tenue verte 🌿"
    },
    {
      text: "Quel jour d'octobre célèbres-tu tes 18 ans ?",
      options: ["14 octobre", "15 octobre", "16 octobre", "17 octobre"],
      correctIndex: 3,           // "17 octobre" ✓
      digitRevealed: "7",
      successFeedback: "Le 17 octobre ! 18 ans aujourd'hui pour ma reine d'amour 👑✨"
    },
    {
      text: "À quelle heure commençait l'étude du soir où on s'est rencontrés ?",
      options: ["17h00", "18h00", "19h00", "20h00"],
      correctIndex: 2,           // "19h00" ✓
      digitRevealed: "1",
      successFeedback: "19h précises… ce moment où tout a basculé pour toujours 🕯️"
    },
    {
      text: "De quel mois es-tu née, Fanta ?",
      options: ["Août", "Septembre", "Novembre", "Octobre"],
      correctIndex: 3,           // "Octobre" ✓
      digitRevealed: "0",
      successFeedback: "Octobre 🍂 — le plus beau mois de l'année, évidemment !"
    }
  ]
};

/* ============================================================
   SECTION 2 : ÉTAT DE L'APPLICATION
   ============================================================ */
let currentQuestionIndex = 0;
let revealedDigits = ["?", "?", "?", "?"];
let quizCompleteCallback = null;

/* ============================================================
   SECTION 3 : GESTION DES ÉCRANS
   ============================================================ */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(function(s) {
    s.classList.remove("active");
  });
  var target = document.getElementById(id);
  if (target) target.classList.add("active");
}

/* ============================================================
   SECTION 4 : MOTEUR DU QUIZ
   ============================================================ */
function initQuiz(onComplete) {
  currentQuestionIndex = 0;
  revealedDigits = ["?", "?", "?", "?"];
  quizCompleteCallback = onComplete || null;
  renderQuestion();
}

function renderQuestion() {
  var q = QUIZ_CONFIG.questions[currentQuestionIndex];

  // Mise à jour du label progression
  document.getElementById("progress-label").textContent =
    "Question " + (currentQuestionIndex + 1) + " / " + QUIZ_CONFIG.questions.length;

  // Mise à jour des points de progression
  document.querySelectorAll(".dot").forEach(function(dot, i) {
    dot.className = "dot";
    if (i < currentQuestionIndex) dot.classList.add("done");
    if (i === currentQuestionIndex) dot.classList.add("active");
  });

  // Texte de la question
  document.getElementById("question-text").textContent = q.text;

  // Animation d'entrée de la carte
  var card = document.getElementById("question-card");
  card.classList.remove("slide-in");
  void card.offsetWidth; // forcer reflow
  card.classList.add("slide-in");

  // Construire les options
  var grid = document.getElementById("options-grid");
  grid.innerHTML = "";
  q.options.forEach(function(opt, i) {
    var btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.id = "option-" + i;
    btn.addEventListener("click", function() { handleAnswer(i); });
    grid.appendChild(btn);
  });

  // Réinitialiser le feedback
  var fb = document.getElementById("feedback-msg");
  fb.textContent = "";
  fb.className = "feedback-msg";
}

function handleAnswer(selectedIndex) {
  var q = QUIZ_CONFIG.questions[currentQuestionIndex];
  var isCorrect = (selectedIndex === q.correctIndex);
  var grid = document.getElementById("options-grid");
  var feedback = document.getElementById("feedback-msg");

  // Désactiver toutes les options
  grid.querySelectorAll(".option-btn").forEach(function(btn, i) {
    btn.disabled = true;
    if (i === q.correctIndex) btn.classList.add("correct");
    else if (i === selectedIndex && !isCorrect) btn.classList.add("incorrect");
  });

  if (isCorrect) {
    // Révéler le chiffre dans le slot correspondant
    revealedDigits[currentQuestionIndex] = q.digitRevealed;
    animateDigitSlot(currentQuestionIndex, q.digitRevealed);

    // Afficher le message de succès
    feedback.textContent = q.successFeedback;
    feedback.classList.add("feedback-success");

    // Passer à la suite après un délai
    setTimeout(function() {
      currentQuestionIndex++;
      if (currentQuestionIndex >= QUIZ_CONFIG.questions.length) {
        // Quiz terminé — tous les chiffres révélés
        if (quizCompleteCallback) quizCompleteCallback(revealedDigits.join(""));
      } else {
        renderQuestion();
      }
    }, 1700);

  } else {
    // Mauvaise réponse
    feedback.textContent = "Pas tout à fait… réessaie 💭";
    feedback.classList.add("feedback-error");

    setTimeout(function() {
      grid.querySelectorAll(".option-btn").forEach(function(btn) {
        btn.disabled = false;
        btn.classList.remove("correct", "incorrect");
      });
      feedback.textContent = "";
      feedback.className = "feedback-msg";
    }, 1100);
  }
}

function animateDigitSlot(index, digit) {
  var slot = document.getElementById("digit-" + index);
  slot.classList.add("revealing");
  setTimeout(function() {
    slot.textContent = digit;
    slot.classList.remove("revealing");
    slot.classList.add("revealed");
  }, 180);
}

/* ============================================================
   SECTION 5 : LOGIQUE DU CODE PIN
   ============================================================ */
function initPin() {
  var pinBoxes = document.querySelectorAll(".pin-box");

  pinBoxes.forEach(function(box, i) {
    // Naviguer automatiquement entre les cases
    box.addEventListener("input", function() {
      // Ne garder que les chiffres
      box.value = box.value.replace(/\D/g, "").slice(-1);
      if (box.value && i < pinBoxes.length - 1) {
        pinBoxes[i + 1].focus();
      }
    });

    // Backspace → reculer à la case précédente
    box.addEventListener("keydown", function(e) {
      if (e.key === "Backspace" && !box.value && i > 0) {
        pinBoxes[i - 1].focus();
      }
      // Valider avec Entrée
      if (e.key === "Enter") validatePin();
    });

    // Sélectionner le contenu au focus pour faciliter la saisie
    box.addEventListener("focus", function() { box.select(); });
  });

  document.getElementById("btn-unlock").addEventListener("click", validatePin);
}

function validatePin() {
  var pinBoxes = document.querySelectorAll(".pin-box");
  var entered = Array.from(pinBoxes).map(function(b) { return b.value; }).join("");
  var errorEl = document.getElementById("pin-error");

  if (entered.length < 4) {
    shakePin();
    return;
  }

  if (entered === QUIZ_CONFIG.correctPin) {
    errorEl.classList.add("hidden");
    unlockExperience();
  } else {
    errorEl.classList.remove("hidden");
    shakePin();
    setTimeout(function() {
      pinBoxes.forEach(function(b) { b.value = ""; });
      pinBoxes[0].focus();
    }, 850);
  }
}

function shakePin() {
  var row = document.getElementById("pin-row");
  row.classList.remove("shake");
  void row.offsetWidth;
  row.classList.add("shake");
  row.addEventListener("animationend", function() {
    row.classList.remove("shake");
  }, { once: true });
}

/* ============================================================
   SECTION 6.1 : 🎵 GESTION DE LA MUSIQUE (HTMLAudioElement)
   - Fichier local 'music.mp3'
   - Respecte les politiques d'autoplay des navigateurs
   - Déclenché lors du déverrouillage (unlockExperience)
   - Fade-in progressif : volume de 0 à 0.6 sur 4 secondes via GSAP
   ============================================================ */
var bgMusic = null;

function getAudioElement() {
  if (!bgMusic) {
    bgMusic = document.getElementById("bg-music");
    if (!bgMusic) {
      bgMusic = new Audio("music.mp3");
      bgMusic.id = "bg-music";
      bgMusic.loop = true;
      bgMusic.preload = "auto";
      bgMusic.style.display = "none";
      document.body.appendChild(bgMusic);
    }
  }
  return bgMusic;
}

function playBackgroundMusic() {
  var audio = getAudioElement();
  if (!audio) return;

  // Volume initial à 0 pour préparer le fondu sonore
  audio.volume = 0;

  var playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.then(function () {
      // Fade-in progressif : le volume passe progressivement de 0 à 0.6 sur 4 secondes via GSAP
      if (typeof gsap !== "undefined") {
        gsap.to(audio, {
          volume: 0.6,
          duration: 4.0,
          ease: "power1.inOut"
        });
      } else {
        // Fallback doux au cas où GSAP ne serait pas présent
        var startTime = performance.now();
        var timer = setInterval(function () {
          var progress = (performance.now() - startTime) / 4000;
          if (progress >= 1) {
            audio.volume = 0.6;
            clearInterval(timer);
          } else {
            audio.volume = progress * 0.6;
          }
        }, 50);
      }
    }).catch(function (error) {
      console.warn("Autoplay audio bloqué ou lecture impossible :", error);
    });
  }
}

window.playBackgroundMusic = playBackgroundMusic;

/* ============================================================
   SECTION 6 : 🔓 UNLOCK EXPERIENCE
   Fonction globale déclenchée quand le PIN est correct.

   Séquence :
     0.0s — musique démarre avec fade-in 4s (volume 0 -> 0.6), overlay "Déverrouillage..." apparaît, #app fonde en sortie
     0.5s — canvas Three.js fonde en entrée (scène 3D visible)
     1.4s — #app masqué (display: none)
     2.0s — window.openBox() → couvercle s'ouvre (GSAP, 2s)
     3.2s — overlay fond en sortie
     4.5s — événement global "experienceUnlocked" émis
   ============================================================ */
function unlockExperience() {
  var app      = document.getElementById("app");
  var overlay  = document.getElementById("unlock-overlay");
  var canvas3d = document.getElementById("three-canvas");

  // Déclencher la lecture de la musique locale avec fade-in doux
  playBackgroundMusic();

  // 1. Afficher l'overlay "Déverrouillage..." avec anneaux dorés
  overlay.classList.remove("hidden");
  void overlay.offsetWidth; // force reflow pour déclencher la transition CSS
  overlay.classList.add("visible");

  // 2. Fondre #app (interface HTML) vers l'opacité 0
  app.style.transition = "opacity 0.8s ease";
  app.style.opacity    = "0";

  // 3. Faire apparaître la scène 3D Three.js
  setTimeout(function () {
    canvas3d.style.opacity = "1";
  }, 300);

  // 4. Masquer l'overlay pour révéler l'écrin fermé au centre
  setTimeout(function () {
    overlay.classList.add("fade-out");
  }, 1100);

  setTimeout(function () {
    overlay.classList.add("hidden");
    overlay.classList.remove("visible", "fade-out");
    app.style.display = "none";
  }, 1600);

  // 5. Déclencher l'ouverture majestueuse de la boîte (GSAP 2.0s via scene.js)
  setTimeout(function () {
    if (typeof window.openBox === "function") {
      window.openBox();
    }
  }, 1800);

  // 6. Signal global que l'expérience est déverrouillée
  setTimeout(function () {
    window.dispatchEvent(new CustomEvent("experienceUnlocked"));
  }, 4000);
}

// Exposer globalement (accessible depuis d'autres scripts / console)
window.unlockExperience = unlockExperience;

/* ============================================================
   SECTION 7 : PARTICULES VISUELLES (fond animé)
   ============================================================ */
function createParticles() {
  var container = document.getElementById("particles-bg");
  var colors = [
    "rgba(212,168,83,0.55)",
    "rgba(240,200,120,0.38)",
    "rgba(255,220,150,0.28)",
    "rgba(255,248,220,0.18)",
    "rgba(255,255,255,0.12)"
  ];

  for (var i = 0; i < 65; i++) {
    var p = document.createElement("div");
    p.className = "particle";
    var size = (Math.random() * 2.5 + 0.8).toFixed(1);
    p.style.cssText = [
      "left:"                 + (Math.random() * 100).toFixed(1) + "vw",
      "top:"                  + (Math.random() * 100).toFixed(1) + "vh",
      "width:"                + size + "px",
      "height:"               + size + "px",
      "background:"           + colors[Math.floor(Math.random() * colors.length)],
      "animation-duration:"   + (Math.random() * 9 + 4).toFixed(1) + "s",
      "animation-delay:  -"   + (Math.random() * 8).toFixed(1) + "s"
    ].join(";");
    container.appendChild(p);
  }
}

/* ============================================================
   SECTION 8 : INITIALISATION
   ============================================================ */
document.addEventListener("DOMContentLoaded", function() {

  // Créer le fond de particules
  createParticles();

  // Bouton "Commencer" → écran quiz
  document.getElementById("btn-start").addEventListener("click", function() {
    showScreen("screen-quiz");
    initQuiz(function(pinCode) {
      // Tous les chiffres révélés → afficher l'écran PIN après un court délai
      setTimeout(function() {
        showScreen("screen-pin");
        // Mettre le focus sur la première case
        setTimeout(function() {
          var first = document.getElementById("pin-0");
          if (first) first.focus();
        }, 600);
      }, 900);
    });
  });

  // Initialiser la logique PIN
  initPin();

  // Bouton "Revoir l'ouverture"
  var replayBtn = document.getElementById("btn-replay-box");
  if (replayBtn) {
    replayBtn.addEventListener("click", function() {
      if (typeof window.closeBox === "function") {
        window.closeBox();
        setTimeout(function() {
          if (typeof window.openBox === "function") {
            window.openBox();
          }
        }, 1500);
      }
    });
  }

  // Fermeture de la modale bijou
  var closeJewelBtn = document.getElementById("btn-close-jewel");
  if (closeJewelBtn) {
    closeJewelBtn.addEventListener("click", closeJewelModal);
  }

  // Navigation par onglets dans la modale bijou
  document.querySelectorAll(".jewel-tab").forEach(function(tab) {
    tab.addEventListener("click", function() {
      var jId = tab.getAttribute("data-jewel");
      showJewelModal(jId);
    });
  });

  // Fermer avec la touche Échap
  window.addEventListener("keydown", function(e) {
    if (e.key === "Escape") closeJewelModal();
  });

});

/* ============================================================
   SECTION 9 : DONNÉES ET CONTRÔLE DE LA MODALE BIJOUX (Raycaster)
   ============================================================ */
var JEWEL_DATA = {
  bague: {
    icon:  "💍",
    tag:   "Or Jaune & Diamant Solitaire",
    title: "La Bague de la Reine",
    desc:  "Forgée dans un or étincelant et surmontée d'un diamant solitaire taille brillant. Elle incarne la pureté et l'éclat inaltérable de mon engagement pour tes 18 ans et pour toujours.",
    quote: "« Tu es mon diamant le plus rare et le plus précieux, Fanta. » — Ton Alphou ❤️"
  },
  bracelet: {
    icon:  "✨",
    tag:   "Argent Pur & Pavé d'Éclats",
    title: "Le Jonc de Notre Histoire",
    desc:  "Un cercle continu sans commencement ni fin. Il symbolise ce fameux soir de 2022 à 19h où nos regards se sont croisés : un lien éternel qui continue d'éclairer nos vies.",
    quote: "« Même à des milliers de kilomètres, ce lien invisible nous unit toujours. » — Alphou ✨"
  },
  collier: {
    icon:  "💎",
    tag:   "Or Jaune & Cristal Étincelant",
    title: "Le Pendentif de Cristal",
    desc:  "Une chaîne délicate retenant une larme de cristal pur. Destiné à reposer tout près de ton cœur, il capte chaque reflet pour célébrer la reine rayonnante que tu es.",
    quote: "« Pour que chaque battement te rappelle à quel point tu es aimée. » — Pour l'éternité 💖"
  }
};

function showJewelModal(jewelId) {
  var data      = JEWEL_DATA[jewelId] || JEWEL_DATA.bague;
  var modal     = document.getElementById("jewel-modal");
  var finalCard = document.getElementById("final-card");

  document.getElementById("jewel-icon").textContent  = data.icon;
  document.getElementById("jewel-tag").textContent   = data.tag;
  document.getElementById("jewel-title").textContent = data.title;
  document.getElementById("jewel-desc").textContent  = data.desc;
  document.getElementById("jewel-quote").textContent = data.quote;

  document.querySelectorAll(".jewel-tab").forEach(function(tab) {
    if (tab.getAttribute("data-jewel") === jewelId) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  // Estomper la carte générale pour mettre en valeur la modale du bijou
  if (finalCard) {
    finalCard.style.opacity = "0";
    finalCard.style.pointerEvents = "none";
  }

  modal.classList.remove("hidden");
  void modal.offsetWidth;
  modal.classList.add("visible");
}

function closeJewelModal() {
  var modal     = document.getElementById("jewel-modal");
  var finalCard = document.getElementById("final-card");

  modal.classList.remove("visible");
  setTimeout(function() {
    modal.classList.add("hidden");
  }, 350);

  if (finalCard && finalCard.classList.contains("visible")) {
    finalCard.style.opacity = "1";
    finalCard.style.pointerEvents = "all";
  }
}

window.showJewelModal  = showJewelModal;
window.closeJewelModal = closeJewelModal;
