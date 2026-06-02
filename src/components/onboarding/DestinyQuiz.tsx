import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { OTAKU_CLASSES, type OtakuClassKey } from "@/lib/constants";
import { Sparkles, ChevronRight } from "lucide-react";

interface QuizAnswer {
  text: string;
  classKey: OtakuClassKey;
}

interface QuizQuestion {
  question: string;
  answers: QuizAnswer[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Dans un groupe d'aventuriers, tu es plutôt celui qui...",
    answers: [
      { text: "...tient la carte et décide du chemin.", classKey: "stratege" },
      { text: "...s'assure que tout le monde a assez de potions de soin.", classKey: "gardien" },
      { text: "...raconte des blagues pour motiver les troupes.", classKey: "barde" },
      { text: "...répare les armures et forge les épées.", classKey: "artisan" },
    ],
  },
  {
    question: "La Japan Expo approche ! Quel est ton premier réflexe ?",
    answers: [
      { text: "Je prépare un planning Excel minute par minute.", classKey: "stratege" },
      { text: "Je commence à coudre mon costume 6 mois à l'avance.", classKey: "artisan" },
      { text: "Je contacte des amis pour y aller à 50.", classKey: "invocateur" },
      { text: "Je lis tous les programmes pour ne rien rater des conférences.", classKey: "chroniqueur" },
    ],
  },
  {
    question: "Un nouveau membre semble perdu sur le Discord. Que fais-tu ?",
    answers: [
      { text: "Je vais lui parler en privé pour le rassurer.", classKey: "gardien" },
      { text: "Je l'invite dans le canal vocal pour rigoler avec nous.", classKey: "barde" },
      { text: "Je lui envoie le lien vers le Règlement Intérieur et le guide.", classKey: "chroniqueur" },
      { text: "Je lui propose de rejoindre mon équipe pour un projet.", classKey: "invocateur" },
    ],
  },
  {
    question: "Quel est ton super-pouvoir caché ?",
    answers: [
      { text: "Je peux convaincre n'importe qui de rejoindre ma cause.", classKey: "invocateur" },
      { text: "Je transforme un carton et de la colle en armure épique.", classKey: "artisan" },
      { text: "Je connais l'histoire de la création du manga par cœur.", classKey: "chroniqueur" },
      { text: "Je suis toujours là quand on a besoin d'un coup de main simple.", classKey: "citoyen" },
    ],
  },
  {
    question: "L'association organise une soirée. Tu t'occupes de quoi ?",
    answers: [
      { text: "De la playlist et du micro !", classKey: "barde" },
      { text: "De la sécurité et du bien-être des invités.", classKey: "gardien" },
      { text: "De l'installation des tables et du rangement.", classKey: "citoyen" },
      { text: "De la logistique générale et du budget.", classKey: "stratege" },
    ],
  },
];

interface DestinyQuizProps {
  onComplete: (selectedClass: OtakuClassKey) => void;
}

export const DestinyQuiz = ({ onComplete }: DestinyQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<Record<OtakuClassKey, number>>({
    stratege: 0,
    gardien: 0,
    barde: 0,
    artisan: 0,
    chroniqueur: 0,
    invocateur: 0,
    citoyen: 0,
  });
  const [showResult, setShowResult] = useState(false);
  const [resultClass, setResultClass] = useState<OtakuClassKey | null>(null);
  const [tiedClasses, setTiedClasses] = useState<OtakuClassKey[]>([]);
  const [cardRevealed, setCardRevealed] = useState(false);

  const handleAnswer = (classKey: OtakuClassKey) => {
    const newScores = { ...scores, [classKey]: scores[classKey] + 1 };
    setScores(newScores);

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate result
      const maxScore = Math.max(...Object.values(newScores));
      const topClasses = (Object.keys(newScores) as OtakuClassKey[]).filter(
        (key) => newScores[key] === maxScore
      );

      if (topClasses.length > 1) {
        setTiedClasses(topClasses);
      } else {
        setResultClass(topClasses[0]);
      }
      setShowResult(true);
      setTimeout(() => setCardRevealed(true), 500);
    }
  };

  const handleTieBreaker = (classKey: OtakuClassKey) => {
    setResultClass(classKey);
    setTiedClasses([]);
    setCardRevealed(true);
  };

  const handleAccept = () => {
    if (resultClass) {
      onComplete(resultClass);
    }
  };

  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
      {/* RPG Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: window.innerHeight + 10 
            }}
            animate={{ 
              y: -10,
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Le Choix du Destin</span>
          </div>
          <h1 className="font-display text-4xl text-foreground mb-2">
            {showResult ? "La Révélation" : "Découvre ta Classe"}
          </h1>
          {!showResult && (
            <p className="text-muted-foreground">
              Réponds sincèrement pour révéler ta vraie nature...
            </p>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {!showResult ? (
            // Quiz Questions
            <motion.div
              key={`question-${currentQuestion}`}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl"
            >
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Question {currentQuestion + 1}/{QUIZ_QUESTIONS.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    initial={{ width: `${((currentQuestion) / QUIZ_QUESTIONS.length) * 100}%` }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Question */}
              <h2 className="font-display text-xl text-foreground mb-6">
                {QUIZ_QUESTIONS[currentQuestion].question}
              </h2>

              {/* Answers */}
              <div className="space-y-3">
                {QUIZ_QUESTIONS[currentQuestion].answers.map((answer, index) => (
                  <motion.button
                    key={index}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleAnswer(answer.classKey)}
                    className="w-full text-left p-4 bg-background/50 hover:bg-primary/10 border border-border hover:border-primary/50 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-muted rounded-lg text-sm font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1 text-foreground">{answer.text}</span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : tiedClasses.length > 0 ? (
            // Tie Breaker
            <motion.div
              key="tiebreaker"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl text-center"
            >
              <div className="text-6xl mb-4">⚖️</div>
              <h2 className="font-display text-2xl text-foreground mb-2">
                Ton cœur balance...
              </h2>
              <p className="text-muted-foreground mb-6">
                Deux voies s'offrent à toi. Laquelle préfères-tu ?
              </p>
              <div className="grid grid-cols-2 gap-4">
                {tiedClasses.map((classKey) => {
                  const classInfo = OTAKU_CLASSES[classKey];
                  return (
                    <motion.button
                      key={classKey}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTieBreaker(classKey)}
                      className="p-6 bg-background/50 hover:bg-primary/10 border border-border hover:border-primary rounded-xl transition-all"
                    >
                      <div className="text-4xl mb-2">{classInfo.icon}</div>
                      <div className="font-display text-lg text-foreground">{classInfo.name}</div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : resultClass ? (
            // Result Card
            <motion.div
              key="result"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              {/* Tarot Card */}
              <motion.div
                className="relative w-72 h-96 mb-8 perspective-1000"
                style={{ perspective: 1000 }}
              >
                <motion.div
                  className="w-full h-full relative"
                  initial={{ rotateY: 180 }}
                  animate={{ rotateY: cardRevealed ? 0 : 180 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Card Front */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary rounded-2xl p-1 shadow-2xl"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="w-full h-full bg-card rounded-xl p-6 flex flex-col items-center justify-center border-4 border-primary/30">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className="text-8xl mb-4"
                      >
                        {OTAKU_CLASSES[resultClass].icon}
                      </motion.div>
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                      >
                        <h3 className="font-display text-2xl text-foreground text-center mb-2">
                          {OTAKU_CLASSES[resultClass].name}
                        </h3>
                        <p className="text-sm text-muted-foreground text-center">
                          {OTAKU_CLASSES[resultClass].description}
                        </p>
                      </motion.div>
                      {/* Decorative corners */}
                      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/50"></div>
                      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/50"></div>
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/50"></div>
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/50"></div>
                    </div>
                  </div>
                  
                  {/* Card Back */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary rounded-2xl p-1 shadow-2xl"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <div className="w-full h-full bg-card rounded-xl flex items-center justify-center">
                      <div className="text-6xl opacity-30">✨</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Result Text */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center mb-6"
              >
                <h2 className="font-display text-2xl text-foreground mb-2">
                  Ton âme résonne avec la voie du...
                </h2>
                <p className="text-3xl font-display text-primary">
                  {OTAKU_CLASSES[resultClass].name} !
                </p>
              </motion.div>

              {/* Accept Button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <Button 
                  variant="cta" 
                  size="lg" 
                  onClick={handleAccept}
                  className="px-8"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Accepter mon destin
                </Button>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default DestinyQuiz;
