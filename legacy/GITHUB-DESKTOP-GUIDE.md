# 🚀 Guide GitHub Desktop - Manga Paradise Sauvetage

## ✅ État actuel

Votre repository est **déjà configuré et synchronisé** avec GitHub !

- **Repository local** : `/Users/lucasprotin19/Desktop/Visual-Code-Manga-Paradise/MANGA-PARADISE-SAUVETAGE`
- **Repository distant** : `https://github.com/mangapradise06/MANGA-PARADISE-SAUVETAGE.git`
- **Branche** : `main`
- **Dernier commit** : `🚀 Sauvetage Réussi - Manga Paradise Clean Start`

---

## 📱 Ouvrir dans GitHub Desktop

### Méthode 1 : Via le menu "Add"

1. Ouvrez **GitHub Desktop**
2. Cliquez sur **File** → **Add Local Repository**
3. Cliquez sur **Choose...** et naviguez vers :
   ```
   /Users/lucasprotin19/Desktop/Visual-Code-Manga-Paradise/MANGA-PARADISE-SAUVETAGE
   ```
4. Cliquez sur **Add Repository**

### Méthode 2 : Via le Terminal (plus rapide)

```bash
# Ouvrir directement dans GitHub Desktop
open -a "GitHub Desktop" /Users/lucasprotin19/Desktop/Visual-Code-Manga-Paradise/MANGA-PARADISE-SAUVETAGE
```

---

## 🎯 Workflow GitHub Desktop

### 1. Faire des modifications

Éditez vos fichiers dans VSCode ou votre éditeur préféré.

### 2. Voir les changements

Dans GitHub Desktop, vous verrez automatiquement :
- Les fichiers modifiés (en orange)
- Les fichiers ajoutés (en vert)
- Les fichiers supprimés (en rouge)

### 3. Commit

1. Cochez les fichiers à inclure dans le commit
2. Écrivez un message de commit dans le champ en bas à gauche
3. Cliquez sur **Commit to main**

### 4. Push vers GitHub

1. Cliquez sur **Push origin** en haut à droite
2. Vos changements sont maintenant sur GitHub !

---

## 🔧 Commandes Git équivalentes (si besoin)

Si GitHub Desktop ne fonctionne pas, vous pouvez utiliser le terminal :

```bash
# Aller dans le dossier
cd /Users/lucasprotin19/Desktop/Visual-Code-Manga-Paradise/MANGA-PARADISE-SAUVETAGE

# Voir l'état
git status

# Ajouter tous les fichiers modifiés
git add .

# Faire un commit
git commit -m "Votre message de commit"

# Pousser vers GitHub
git push origin main

# Tirer les dernières modifications
git pull origin main
```

---

## 🆘 Problèmes courants

### "Repository not found" dans GitHub Desktop

**Solution** : Le repo est déjà configuré. Utilisez simplement **Add Local Repository**.

### "Authentication failed"

**Solution** :
1. Dans GitHub Desktop : **Preferences** → **Accounts**
2. Reconnectez votre compte GitHub
3. Autorisez GitHub Desktop

### "Cannot push to remote"

**Solution** :
```bash
# Vérifier la connexion
cd /Users/lucasprotin19/Desktop/Visual-Code-Manga-Paradise/MANGA-PARADISE-SAUVETAGE
git remote -v

# Si besoin, reconfigurer
git remote set-url origin https://github.com/mangapradise06/MANGA-PARADISE-SAUVETAGE.git
```

---

## 🎨 Prochaines étapes

1. **Installer les dépendances** :
   ```bash
   cd /Users/lucasprotin19/Desktop/Visual-Code-Manga-Paradise/MANGA-PARADISE-SAUVETAGE
   npm install
   ```

2. **Lancer le projet** :
   ```bash
   npm run dev
   ```

3. **Développer** et utiliser GitHub Desktop pour vos commits !

---

## 📚 Ressources

- [Documentation GitHub Desktop](https://docs.github.com/en/desktop)
- [Votre repo sur GitHub](https://github.com/mangapradise06/MANGA-PARADISE-SAUVETAGE)

---

**✨ Votre code est maintenant dans un environnement Git propre et sain !**
