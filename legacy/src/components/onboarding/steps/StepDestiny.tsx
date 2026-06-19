import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OTAKU_CLASSES, OTAKU_CLASS_LIST, type OtakuClassKey } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, RotateCcw } from "lucide-react";

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

interface StepDestinyProps {
  onClassSelect: (classKey: OtakuClassKey) => void;
  selectedClass?: OtakuClassKey;
}

export const StepDestiny = ({ onClassSelect, selectedClass }: StepDestinyProps) => {
  const [mode, setMode] = useState<"choice" | "quiz" | "manual" | "result">(
    selectedClass ? "result" : "choice"
  );
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
  const [resultClass, setResultClass] = useState<OtakuClassKey | undefined>(selectedClass);
  const [tiedClasses, setTiedClasses] = useState<OtakuClassKey[]>([]);

  const resetQuiz = () => {
    setMode("choice");
    setCurrentQuestion(0);
    setScores({
      stratege: 0,
      gardien: 0,
      barde: 0,
      artisan: 0,
      chroniqueur: 0,
      invocateur: 0,
      citoyen: 0,
    });
    setResultClass(undefined);
    setTiedClasses([]);
  };

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
        onClassSelect(topClasses[0]);
      }
      setMode("result");
    }
  };

  const handleTieBreaker = (classKey: OtakuClassKey) => {
    setResultClass(classKey);
    setTiedClasses([]);
    onClassSelect(classKey);
  };

  const handleManualSelect = (classKey: OtakuClassKey) => {
    setResultClass(classKey);
    onClassSelect(classKey);
    setMode("result");
  };

  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <AnimatePresence mode="wait">
        {/* Mode Selection */}
        {mode === "choice" && (
          <motion.div
            key="choice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <p className="text-white/60 text-center">
              Comment veux-tu découvrir ta classe ?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode("quiz")}
                className="p-6 bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF6B6B]/5 border border-[#FF6B6B]/30 rounded-xl text-left hover:border-[#FF6B6B]/60 transition-all"
              >
                <Sparkles className="w-8 h-8 text-[#FF6B6B] mb-3" />
                <h3 className="font-display text-lg text-white mb-1">Le Test du Destin</h3>
                <p className="text-sm text-white/60">
                  Réponds à 5 questions pour révéler ta vraie nature d'aventurier
                </p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode("manual")}
                className="p-6 bg-gradient-to-br from-[#4ECDC4]/20 to-[#4ECDC4]/5 border border-[#4ECDC4]/30 rounded-xl text-left hover:border-[#4ECDC4]/60 transition-all"
              >
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-display text-lg text-white mb-1">Choix Libre</h3>
                <p className="text-sm text-white/60">
                  Tu sais déjà quelle classe te correspond ? Choisis directement !
                </p>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Quiz Mode */}
        {mode === "quiz" && (
          <motion.div
            key={`question-${currentQuestion}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs text-white/60 mb-2">
                <span>Question {currentQuestion + 1}/{QUIZ_QUESTIONS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4]"
                  initial={{ width: `${((currentQuestion) / QUIZ_QUESTIONS.length) * 100}%` }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <h3 className="font-display text-xl text-white">
              {QUIZ_QUESTIONS[currentQuestion].question}
            </h3>

            {/* Answers */}
            <div className="space-y-3">
              {QUIZ_QUESTIONS[currentQuestion].answers.map((answer, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleAnswer(answer.classKey)}
                  className="w-full text-left p-4 bg-white/5 hover:bg-[#FF6B6B]/10 border border-white/10 hover:border-[#FF6B6B]/50 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg text-sm font-bold text-white/60 group-hover:bg-[#FF6B6B] group-hover:text-white transition-colors">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1 text-white">{answer.text}</span>
                    <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#FF6B6B] transition-colors" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Manual Selection Mode */}
        {mode === "manual" && (
          <motion.div
            key="manual"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/60">Choisis ta classe :</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMode("choice")}
                className="text-white/60 hover:text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OTAKU_CLASS_LIST.map((cls) => (
                <motion.button
                  key={cls.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleManualSelect(cls.id as OtakuClassKey)}
                  className="p-4 bg-white/5 hover:bg-[#4ECDC4]/10 border border-white/10 hover:border-[#4ECDC4]/50 rounded-xl text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cls.icon}</span>
                    <div>
                      <h4 className="font-medium text-white">{cls.name}</h4>
                      <p className="text-xs text-white/50 line-clamp-1">{cls.description}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tie Breaker */}
        {mode === "result" && tiedClasses.length > 0 && (
          <motion.div
            key="tiebreaker"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="text-5xl mb-2">⚖️</div>
            <h3 className="font-display text-xl text-white">Ton cœur balance...</h3>
            <p className="text-white/60">Deux voies s'offrent à toi. Laquelle préfères-tu ?</p>
            <div className="grid grid-cols-2 gap-4">
              {tiedClasses.map((classKey) => {
                const classInfo = OTAKU_CLASSES[classKey];
                return (
                  <motion.button
                    key={classKey}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTieBreaker(classKey)}
                    className="p-6 bg-white/5 hover:bg-[#FF6B6B]/10 border border-white/10 hover:border-[#FF6B6B] rounded-xl transition-all"
                  >
                    <div className="text-4xl mb-2">{classInfo.icon}</div>
                    <div className="font-display text-lg text-white">{classInfo.name}</div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Result */}
        {mode === "result" && tiedClasses.length === 0 && resultClass && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            {/* Class Card */}
            <motion.div
              initial={{ rotateY: 90 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-block"
            >
              <div className="w-56 h-72 bg-gradient-to-br from-[#FF6B6B] via-[#4ECDC4] to-[#FF6B6B] rounded-2xl p-1 shadow-2xl mx-auto">
                <div className="w-full h-full bg-[#292438] rounded-xl p-6 flex flex-col items-center justify-center">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="text-7xl mb-4"
                  >
                    {OTAKU_CLASSES[resultClass].icon}
                  </motion.span>
                  <h3 className="font-display text-xl text-white mb-2">
                    {OTAKU_CLASSES[resultClass].name}
                  </h3>
                  <p className="text-xs text-white/60 text-center">
                    {OTAKU_CLASSES[resultClass].description}
                  </p>
                </div>
              </div>
            </motion.div>

            <div>
              <h3 className="font-display text-xl text-white mb-2">
                Ton âme résonne avec la voie du...
              </h3>
              <p className="text-2xl font-display text-[#4ECDC4]">
                {OTAKU_CLASSES[resultClass].name} !
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetQuiz}
              className="text-white/60 hover:text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Refaire le test
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
