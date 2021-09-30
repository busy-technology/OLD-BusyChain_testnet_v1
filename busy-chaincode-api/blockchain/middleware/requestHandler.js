export const sendResponse = async (res, status, statusCode, message, data, txId, fileName = '') => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  
    let customError = message || 'Blockchain Error';
    fileName !== ''
      ? res.write(
          JSON.stringify({
            status,
            statusCode,
            message: customError,
            fileName,
            txId,
            data,
          }),
        )
      : res.write(
          JSON.stringify({
            status,
            statusCode,
            message: customError,
            txId,
            data,
          }),
        );
  
    res.end();
  };
  