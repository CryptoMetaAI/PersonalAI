import { useColorMode } from '@chakra-ui/react';
import Image from 'next/image';

const XNFTLogo = () => {
  const { colorMode } = useColorMode();

  return <Image src={colorMode === 'dark' ? '/chatbot.svg' : '/chatbot.svg'} height={45} width={45} alt="FansNFT" />;
};

export default XNFTLogo;
