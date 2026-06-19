import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-hero rounded-3xl p-8 md:p-12 shadow-primary-lg text-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-32 -translate-x-32 blur-3xl"></div>
            
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-6"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              
              <h2 className="font-display italic font-extrabold text-3xl md:text-5xl text-white mb-4">
                Rejoignez l'Aventure
              </h2>
              
              <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                Devenez membre de Manga Paradise et profitez d'avantages exclusifs, 
                d'événements privilégiés et d'une communauté passionnée.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  variant="secondary"
                  size="xl"
                  className="bg-white text-mp-ink hover:bg-mp-paper border-0 group shadow-md hover:shadow-lg"
                >
                  Devenir Membre
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="xl"
                  className="border-2 border-white text-white hover:bg-white hover:text-foreground bg-transparent"
                >
                  En Savoir Plus
                </Button>
              </div>
              
              <div className="mt-8 flex items-center justify-center gap-8 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Sans engagement</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Résiliable à tout moment</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;