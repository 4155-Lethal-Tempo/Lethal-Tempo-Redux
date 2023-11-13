# Lethal-Tempo-Redux

**Requirements**

1: NodeJS: https://nodejs.org/en/download/current
2: A Spotify Account

**Recommended IDE**

VSCode: https://code.visualstudio.com/download


# How to run locally

1: Clone Repository and open it up on VSCode

2: Install all dependencies using the command `npm install` in your terminal

3: Go to the following website and sign up for a developer account: https://developer.spotify.com/

4: On the top left side click on your name and navigate to your dashboard:

<img width="250" alt="image" src="https://github.com/4155-Lethal-Tempo/Lethal-Tempo-Redux/assets/112443437/647be87b-dcd0-4a9c-81db-439256700466">

5: You will then be taken to a page that looks like this one, click create app:

<img width="953" alt="image" src="https://github.com/4155-Lethal-Tempo/Lethal-Tempo-Redux/assets/112443437/5286aed7-eac1-486d-8a6b-5a4f152a7c1a">


6: Fill in your app name, description, and select Web API (You do not need to fill in the website entry). Your redirect uri will be `http://localhost:8084/callback`

7: You will then be taken to the dashboard after this, click on settings

8: Next you will see your client ID, copy this and paste it into the file **.env-example** in the quotation marks.

9: Back on the Spotify Developer Website, click *View client secret*, copy your client secret and paste it into **.env-example**

10: Paste the callback URL (this: `http://localhost:8084/callback`) into Callback

11: Change the name of the **.env-example** file to just **.env**

12: In your terminal type `npm start`

13: Head to your browser and in the address bar type `localhost:8084` and sign in to test it out!






