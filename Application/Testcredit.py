import re

email_text = """Bonjour Mamadou, \r\n        \nVous avez rcemment effectu un achat de 30,07$  MAXI #8634 avec votre CIBC Dividend Visa Infinite Card dont le numro se termine par 0165.\nPour plus de dtails sur cette opration, ouvrez \nune session bancaire CIBC en ligne ou dans l'appli\n.\nCordialement, \nLa Banque CIBC\nLa Banque CIBC s'engage  protger vos renseignements personnels. Nous n'allons pas inclure de renseignements personnels  votre sujet dans des messages en dehors de Services bancaires en direct ou mobiles car le courrier lectronique n'est pas un mode de communication scuris.\nVeuillez ne pas rpondre au prsent courriel.\nSi vous avez reu ce message par erreur, veuillez ouvrir une session sur CIBC en direct. Slectionnez Nous contacter, puis Commencez  clavarder, pour vous connecter  notre assistant virtuel ou  un reprsentant CIBC.\nSi vous ne souhaitez plus recevoir ces alertes, ouvrez une session Services bancaires CIBC, allez  la section Grer mes alertes et dsactivez la fonction.\nCette alerte sera envoye par courriel, qui n'est pas protg et pourrait tre perdu, intercept ou lu par d'autres.\nCourriel en texte brut :\nSi vous slectionnez le format texte brut, votre courriel n'affichera pas de graphiques ni de liens.\n\n"""

# Define the regex pattern
pattern = r"achat de ([\d,]+\$)\s*(.*?)\s+avec votre"

# Find the match
match = re.search(pattern, email_text)

if match:
    amount = match.group(1)
    shop = match.group(2)
    print("Amount:", amount)
    print("Shop:", shop)
else:
    print("No match found.")