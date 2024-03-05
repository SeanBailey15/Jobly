# Jobly API

### Description  
The Jobly API is a cumulative project assignment for the UMass Global Software Engineering Bootcamp curriculum. It is an opportunity for students to demonstrate their knowledge of JavaScript, Node.js, Express.js, and PostgreSQL, as well as authentication and authorization with JSON Web Tokens and JSON Schemas. In the project, students are tasked with building upon a working API, adding more models, routes, authorization checks, filtering funcitonality, and test suites to verify it all works.  

#### Node Packages Used:  

- Bcrypt: User password hashing.  
- body-parser: Parsing JSON request bodies.
- colors: Add some custom coloring to config properties in the console display.
- cors: Enable cross-origin resource sharing for the API.
- dotenv: Allows storage of environment configuration separate from the code.
- express: Express web framework.
- jsonschema: Validate incoming data based on dev-created schemas.
- jsonwebtoken: Create and authenticate JWTs .
- morgan: HTTP request logger middleware.
- pg: PostgreSQL client

## Getting Started  

At the time of publication, I can only provide instructions for installation using the Bash command line. I recommend using ```WSL2``` if you are on a Windows machine. I will not go into setting up WSL2 on your machine in these instructions. These instructions also assume the user has previously installed ```Node.js``` and ```npm``` on their machine, and has a basic understanding of how to use them.

***Fair warning: I am a student developer.*** These instructions are provided to the best of **MY** knowledge. Google, Stack Overflow, Reddit and MDN Documentation have been essential for troubleshooting throughout my educational journey.  

### From within the Bash terminal:

1. **Install PostgreSQL:**  
   
   ```$ sudo apt install postgresql```

2. **Navigate to your chosen directory and clone the repository there with the following command:**  
   
   ```$ git clone https://github.com/SeanBailey15/Jobly.git```

3. ***(Optional but recommended)*** Install nodemon globally to automatically restart the application when file changes are detected (similar to the Live Server extension in VSCode). Global installation makes nodemon available to all of your apps, regardless of which directory they are in:  
   
   ```$ npm install -g nodemon```  

4. **Navigate into the app directory:**  
   
   ```$ cd Jobly```  

5. **Install app requirements:**  
   
   ```$ npm install```  

6. **Create and populate the database with the ```jobly.sql``` file:**  
   
    ```$ psql < jobly.sql```  

    **You will be prompted for input on which databases to create in the terminal* 

7. **Run the app:**  
   
   ```$ PGPASSWORD=<your_postgresql_password> nodemon server.js```

   **Do not include the '<' or '>' characters*  

   **You may not need the password argument depending on how you've configured PostgreSQL.  
   In this case run this command:*  

   ```$ nodemon server.js```  

8. **The app is pre-configured to run on Port 3001.**  

## Endpoints (Using the API) 

In order to try out the API, use an API client such as [Insomnia](https://insomnia.rest/)

There are four main endpoints in the current version of this app:  
- /auth
- /users
- /companies   
- /jobs  

**Most (but not all) endpoints require an authenticated user or authenticated admin token to be accessed.**

Depending on which type of HTTP verb is used to request the endpoint, the app will perform the appropriate CRUD operation on the database tables. The HTTP verbs and routes/endpoints are as follows:   

### /auth  
---
- **Both endpoints are accessible to anonymous users**  

- **POST** http://localhost:3001/auth/register  

    - **THIS IS THE FIRST ENDPOINT YOU SHOULD ACCESS**  
    - Accepts a JSON body:  
        ``` json 
        {
            "username": "my-user",
            "password": "my-pass",
            "firstName": "John",
            "lastName": "Doe",
            "email": "jdoe@email.com"
        }
        ```  
    
    - This will register a user to the database. The password provided will be hashed before being stored in the database.

    - This will return a JSON web token. Be sure to copy the token to a note app or something similar. You will need it to access many of the endpoints for this API.  
    **This will be a standard user token, granting "logged in" privileges, not admin**  

    - This new user will **NOT** be an admin by default. Only an admin can grant admin privileges to another user. This can be circumvented by accessing the database in the terminal:  
        ```$ psql jobly```  

    - While within the psql terminal, run this SQL query:  
        ```UPDATE users SET is_admin=true WHERE username='my-user';```  

        ***This can also be achieved with the PATCH /users route found below**

- **POST** http://localhost:3001/auth/token  

    - This endpoint is for logging in as an existing user.  

    - Accepts a JSON body:  
        ``` json
        {
            "username": "my-user",
            "password": "my-pass"
        }
        ```  
    - This will log the user in and return a JSON web token.  
  
    - **If you followed the above instructions to grant yourself admin privileges, you MUST access this endpoint to receive a new token that has admin rights.**  
  
    - Be sure to copy the token to a note app or something similar. You will need it to access many of the endpoints for this API. 

### A word about the token

The token provided is a **Bearer token**. When accessing the routes through an API client, this token must be entered in the AUTH field as such. Each description below makes note of the required level of authorization to access the endpoint. Be sure your token has the correct credentials or you will experience request errors.

### /users
---

- **GET** http://localhost:3001/users  

  - **Authorization Required: Admin**

  - This endpoint will retrieve a list of all users in the database.  
  
  - Displays username, firstName, lastName, email, isAdmin, and a list of jobs the user has applied to. The list of jobs simply displays the job ids.
  
- **GET** http://localhost:3001/users/ ```<username>```  
  
  - **Authorization Required: Admin or logged-in User**  

  - If accessing as a standard user, you may only access your own username.
  
  - This endpoint will retrieve information about a specified user in the database.  

  - Displays username, firstName, lastName, email, isAdmin, and a list of jobs the user has applied to.
  
- **POST** http://localhost:3001/users  

  - **Authorization Required: Admin**
  
  - Allows an admin to create a user, including granting the new user admin privileges upon creation.  
  
  - Accepts a JSON body:  
    ``` json
    {
            "username": "new-user",
            "password": "new-pass",
            "firstName": "Jane",
            "lastName": "Doe",
            "email": "jdoe@email.com",
            "isAdmin": true/false
    } 
    ```  

- **POST** http://localhost:3001/users/```<username>```/jobs/```<jobId>```  

  - **Authorization Required: Admin or logged-in User**
  
  - Allows a user to "apply" for a given job.  
  
  - Creates an entry in the *applications* table of the database.

- **PATCH** http://localhost:3001/users/ ```<username>```  

  - **Authorization Required: Admin or logged-in User** 
  
  - Will update an existing user entry in the database.  

  - Accepts a JSON body with **one or more** of the following properties:  
    ``` json
    {
        "password": "updated-pass",
        "firstName": "Johnny",
        "lastName": "Tsunami",
        "email": "jtsunami@newemail.com"
    }  
    ```  

- **DELETE** http://localhost:3001/users/ ```<username>```  

  - **Authorization Required: Admin or logged-in User**

  - Will delete the database entry for the specified user.  
  
### /companies
---

- **GET** http://localhost:3001/companies?```<optional filters>```  

  - **Authorization Required: None**

  - This endpoint will retrieve a list of all companies in the database. Can be filtered by the following parameters:  

    - **nameLike**: Case insensitive string. Will match any company name that contains the string.  
    - **minEmployees**: Number. Will limit the results to companies with *at least* this number of employees.  
    - **maxEmployees**: Number. Will limit the results to companies with *less than* this number of employees.
  
  - Displays the company handle, name, description, numEmployees, logoUrl.  
  
- **GET** http://localhost:3001/companies/ ```<handle>```  

  - **Authorization Required: None**
  
  - This endpoint will retrieve information about a specified company in the database.  
  
  - Accepts an company handle.  

  - Displays company handle, name, description, numEmployees, logoUrl, and a list of jobs the company is hiring for. Each job is displayed with the id, title, salary, and equity.
  
- **POST** http://localhost:3001/companies  

  - **Authorization Required: Admin**
  
  - Will create a new company entry in the database.  
  
  - Accepts a JSON body:  
    ```json
    {
        "name": "Apple Inc.",
        "handle": "apple",
        "description": "American computer and consumer electronics company famous for creating the iPhone, iPad and Macintosh computers.",
        "numEmployees": 161000,
        "logoUrl": "https://www.apple.com/"
    }
    ```

- **PATCH** http://localhost:3001/companies/ ```<handle>```  

  - **Authorization Required: Admin**
  
  - Will update an existing entry in the database.  

  - Accepts a JSON body with **one or more** of the following parameters:  
    ```json
    {
        "name": "Apple Inc.",
        "description": "American computer and consumer electronics company famous for creating the iPhone, iPad and Macintosh computers.",
        "numEmployees": 161000,
        "logoUrl": "https://www.apple.com/"
    }
    ```  

- **DELETE** http://localhost:3001/companies/ ```<handle>```  

  - **Authorization Required: Admin**

  - Will delete the database entry for the specified company.  
  
### /jobs  

- **GET** http://localhost:3001/jobs?```<optional filters>```  

  - **Authorization Required: None**

  - This endpoint will retrieve a list of all jobs in the database. Can be filtered by the following parameters:  

    - **titleLike**: Case insensitive string. Will match any job title that contains the string.  
    - **minSalary**: Number. Will limit the results to jobs with *at least* this salary. 
    - **hasEquity**: Boolean. Does not require a value. The presence of this parameter in the query string will limit results to jobs that provide equity above 0.
  
  - Displays the job id, title, salary, equity, and companyHandle of the associated company.  

- **GET** http://localhost:3001/jobs/```<jobId>```  

  - **Authorization Required: None**

  - This endpoint will retrieve information about a specified job in the database.  
  
  - Displays the job id, title, salary, equity, and companyHandle of the associated company. 

- **POST** http://localhost:3001/jobs  

  - **Authorization Required: Admin**

  - Creates a single job in the database.  
  
  - Accepts a JSON body:  
    ``` json  
    {
        "title": "Developer",
        "salary": 100000,
        "equity": 0.01,
        "companyHandle": "apple"
    }
    ```  

- **PATCH** http://localhost:3001/jobs/ ```<jobId>```  

  - **Authorization Required: Admin**
  
  - Will update an existing entry in the database.  

  - Accepts a JSON body with **one or more** of the following parameters:  
    ```json
    {
        "title": "Roofer",
        "salary": 32000,
        "equity": null
    }
    ```  

- **DELETE** http://localhost:3001/jobs/ ```<jobId>```  

  - **Authorization Required: Admin**

  - Will delete the database entry for the specified job.  



## Running Tests

To run the tests for the routes in this application, you can use the Jest testing framework along with Supertest for HTTP assertions. Follow these steps to run the tests:

1. **Install Jest and Supertest:**  
   
   If you haven't already installed Jest and Supertest, you can do so by running the following command:  

   ```$ npm install --save-dev jest supertest```  


2. **Run the Tests:**  
   
   Once Jest and Supertest are installed, you can run the tests using the following command:  

   ```$ PGPASSWORD=<your_postgresql_password> jest -i```  
   ***The -i flag for Jest makes it so the tests run “in band” (in order, not at the same time)**

   ***Do not include the '<' or '>' characters**  

   ***The need to pass in the pg password depends on how you've configured your PostgreSQL installation, and whether or not you have altered the config file for this API.**

   This command will execute all test suites and display the test results in the terminal.

3. **View Test Results:**  
   
    Jest will run all the test cases and display the results, including any passed or failed tests and any error messages.

4. **Modify Test Configuration (Optional):**  
   
    If you need to modify the Jest configuration for running tests, you can do so in the `package.json` file under the `"jest"` key.

5. **Adjust Environment Variables (Optional):**  
   
    Depending on your setup, you may need to adjust environment variables such as the database connection string or the port number used for testing. Ensure these variables are correctly configured before running the tests.

By following these steps, you can run the tests for the routes in this application and verify that they are functioning as expected.
 
## Thank you for checking out my project!  

## Contact Me

You can reach out to me on social media:

- [Discord](https://discordapp.com/users/792831510515548220)
- [LinkedIn](https://www.linkedin.com/in/sean-bailey-619723279)
- [Facebook](https://www.facebook.com/profile.php?id=61556172566858)

Feel free to connect with me on any of these platforms!