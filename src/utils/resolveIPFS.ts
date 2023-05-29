export const getImageInfo = async (tokenURI: string) => {    
  const ipfsGateway = 'https://ipfs.fleek.co/ipfs/';
  const svgPrefix = 'data:application/json;base64,';
  const ipfsPrefix = 'ipfs://';
  if (tokenURI.startsWith(svgPrefix)) {
    return JSON.parse(atob(tokenURI.substr(svgPrefix.length))).image;
  } 
  if (tokenURI.startsWith(ipfsPrefix)) {
    const ipfsURL =  ipfsGateway + tokenURI.substr(ipfsPrefix.length);
    console.log(ipfsURL);
    const jsonFile = await fetch(ipfsURL);
    const jsonStr: any = await jsonFile.json();
    return jsonStr.image.startsWith(ipfsPrefix) ? ipfsGateway + jsonStr.image.substr(ipfsPrefix.length) : jsonStr.image;
  }

  return tokenURI;
}