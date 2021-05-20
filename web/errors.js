// /*
//     Custom Errors
// */
// class DBConnectionError extends Error {
//     constructor(description, httpStatusCode = 500, context, ...params) {
//         super(params);
        
//         if (Error.captureStackTrace) {
//             Error.captureStackTrace(this, DBConnectionError);
//         }

//         this.description = description;
//         this.httpStatusCode = httpStatusCode;
//         this.context = context;
//         this.date = new Date();
//     }
// }

class CustomError extends Error {
    constructor(description, httpStatusCode = 500, context, ...params) {
        super(params);
        
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CustomError);
        }

        this.description = description;
        this.httpStatusCode = httpStatusCode;
        this.context = context;
        this.date = new Date();
    }
}

module.exports = CustomError;