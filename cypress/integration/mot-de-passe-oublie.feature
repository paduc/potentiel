# language: fr
Fonctionnalité: Utilisateur, je peux demander un nouveau mot de passe si je l'ai oublié

  @porteur-projet
  Scénario: Le porteur de projet a oublié son mot de passe
    Etant donné que je suis déconnecté
    Lorsque je vais sur la page d'identification
    Et que je clique sur le lien "J'ai oublié mon mot de passe"
    Alors je suis dirigé vers la page d'oubli de mot passe
    Lorsque je saisis mon email dans le champ email
    Et que je valide le formulaire
    Alors on me notifie la réussite par "Vous recevrez un courrier électronique à votre adresse avec un lien de récupération de mot de passe."
    Et je reçois un courrier électronique avec un lien
    Lorsque je clique sur le lien de récupération de mot de passe
    Alors je suis dirigé vers une page de changement de mot de passe
    Lorsque je saisis le nouveau mot de passe "hello" dans les deux champs
    Et que je valide le formulaire
    Alors je suis dirigé vers la page d'identification
    Et on me notifie la réussite par "Votre mot de passe a été mis à jour, vous pouvez à présent vous identifier."
    Lorsque je saisis mon email dans le champ email
    Et je saisis "hello" dans le champ mot de passe
    Alors je me rends sur la page qui liste mes projets



