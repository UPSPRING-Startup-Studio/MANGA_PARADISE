import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, PenTool, BookOpen, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const articles = [
  {
    id: 1,
    title: "Les mangas incontournables de l'hiver 2025",
    excerpt: "Notre sélection des séries qui font parler d'elles cette saison...",
    category: "Actualités",
    date: "22 Déc 2025",
    image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=600",
    readTime: "5 min"
  },
  {
    id: 2,
    title: "Interview exclusive : L'artiste derrière les illustrations du Hub",
    excerpt: "Rencontre avec notre illustrateur officiel qui nous dévoile les coulisses...",
    category: "Interview",
    date: "18 Déc 2025",
    image: "https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=600",
    readTime: "8 min"
  },
  {
    id: 3,
    title: "Retour sur la Japan Expo 2025",
    excerpt: "Notre équipe était présente au plus grand événement manga de France...",
    category: "Événements",
    date: "15 Déc 2025",
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600",
    readTime: "6 min"
  },
  {
    id: 4,
    title: "Guide : Débuter dans le cosplay",
    excerpt: "Tous nos conseils pour créer votre premier costume de A à Z...",
    category: "Tutoriel",
    date: "10 Déc 2025",
    image: "https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?w=600",
    readTime: "12 min"
  },
];

const categories = [
  { name: "Actualités", icon: Calendar, count: 24 },
  { name: "Tutoriels", icon: PenTool, count: 12 },
  { name: "Culture", icon: BookOpen, count: 18 },
  { name: "Communauté", icon: Users, count: 8 },
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 bg-gradient-neon overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920')] bg-cover bg-center opacity-10" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="font-display text-5xl lg:text-7xl text-foreground mb-4">
                LE <span className="text-sakura">BLOG</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Actualités, tutoriels, interviews et culture otaku. 
                Restez connectés à l'univers Manga Paradise.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-8 border-b border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((cat, index) => (
                <motion.button
                  key={cat.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-sakura/10 hover:text-sakura transition-colors"
                >
                  <cat.icon className="h-4 w-4 text-turquoise" />
                  <span className="font-medium text-sm">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">({cat.count})</span>
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Featured Article */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="md:col-span-2 lg:col-span-2"
              >
                <Card className="overflow-hidden h-full bg-card hover:shadow-glow transition-all group">
                  <div className="relative h-64 lg:h-80">
                    <img
                      src={articles[0].image}
                      alt={articles[0].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-tokyo-night/90 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <span className="inline-block px-3 py-1 bg-sakura text-tokyo-night text-xs font-semibold rounded-full mb-3">
                        {articles[0].category}
                      </span>
                      <h2 className="font-display text-2xl lg:text-3xl text-foreground mb-2">
                        {articles[0].title}
                      </h2>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {articles[0].excerpt}
                      </p>
                      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                        <span>{articles[0].date}</span>
                        <span>•</span>
                        <span>{articles[0].readTime} de lecture</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Other Articles */}
              {articles.slice(1).map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Card className="overflow-hidden h-full bg-card hover:shadow-glow transition-all group cursor-pointer">
                    <div className="relative h-48">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-2 py-1 bg-sakura/90 text-tokyo-night text-xs font-semibold rounded">
                        {article.category}
                      </span>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-display text-lg text-foreground mb-2 line-clamp-2 group-hover:text-sakura transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{article.date}</span>
                        <span>{article.readTime}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg" className="gap-2">
                Voir plus d'articles
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16 bg-gradient-neon">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center"
            >
              <h2 className="font-display text-3xl lg:text-4xl text-foreground mb-4">
                NE MANQUEZ RIEN
              </h2>
              <p className="text-muted-foreground mb-6">
                Recevez nos derniers articles et actualités directement dans votre boîte mail.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className="flex-1 px-4 py-3 rounded-lg bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sakura"
                />
                <Button className="bg-gradient-cta text-tokyo-night font-semibold hover:brightness-110">
                  S'inscrire
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
