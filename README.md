# Lethal-Tempo-Redux

**Requirements**

1: NodeJS: https://nodejs.org/en/download/current

2: MongoDB And MongoDB Compass: https://www.mongodb.com/docs/v2.6/tutorial/install-mongodb-on-windows/

3: A Spotify Account

**Recommended IDE**

VSCode: https://code.visualstudio.com/download


# How to run locally

1: Clone Repository and open it up on VSCode

2: Install all dependencies using the command `npm install` in your terminal

3: Open MongoDB Compass and copy your local connection string, it should look something like: *mongodb://127.0.0.1:27017/testDB*

4: Paste that string into **line 23** of **app.js**

5: Go to the following website and sign up for a developer account: https://developer.spotify.com/

6: On the top left side click on your name and navigate to your dashboard:
<p align="center">
  <img width="250" alt="image" src="https://github.com/4155-Lethal-Tempo/Lethal-Tempo-Redux/assets/112443437/647be87b-dcd0-4a9c-81db-439256700466">
</p>

7: You will then be taken to a page that looks like this one, click create app:

<p align="center">
  <img width="953" alt="image" src="https://github.com/4155-Lethal-Tempo/Lethal-Tempo-Redux/assets/112443437/5286aed7-eac1-486d-8a6b-5a4f152a7c1a">
</p>

8: Fill in your app name, description, and select Web API (You do not need to fill in the website entry). Your redirect uri will be `http://localhost:8084/callback`

9: You will then be taken to the dashboard after this, click on settings

10: Next you will see your client ID, copy this and paste it into the file **.env-example** in the quotation marks.

11: Back on the Spotify Developer Website, click *View client secret*, copy your client secret and paste it into **.env-example**

12: Paste the callback URL (this: `http://localhost:8084/callback`) into Callback

13: Change the name of the **.env-example** file to just **.env**

14: In your terminal type `npm start`

15: Head to your browser and in the address bar type `localhost:8084` and sign in to test it out!






