import * as Sentry from '@sentry/browser';

function init()
{   
    alert(`DSN is ${process.env.REACT_APP_SENTRY_URL.toString()}`) 
    Sentry.init({
         dsn: process.env.REACT_APP_SENTRY_URL.toString()
        });
}

function logError(error)
{
    Sentry.captureException(error)
}

function logInfo(message)
{
    Sentry.captureMessage(message)
}

export default
{
    init,
    logError,
    logInfo

}