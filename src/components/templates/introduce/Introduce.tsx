import { Flex, Container, Heading, Stack, Text, Button, Image } from '@chakra-ui/react';
import Router from 'next/router';

export default function CallToActionWithIllustration() {
  return (
    <Container maxW={'5xl'}>
      <Stack textAlign={'center'} align={'center'} spacing={{ base: 8, md: 10 }} py={{ base: 20, md: 28 }}>
        <Heading fontWeight={600} fontSize={{ base: '3xl', sm: '4xl', md: '6xl' }} lineHeight={'110%'}>
          <Text as={'span'} color={'#81e6d9'}>
            Customize Your Personal Bot
          </Text>
        </Heading>
        <Text color={'gray.500'} maxW={'3xl'}>
          This website builds upon the universal AI and specializes in creating customized chatbots with
          specific functionalities, such as the GPT bot for English spoken conversation, and the GPT bot that can act as
          your personal life assistant, and so on.
        </Text>
        <Stack spacing={6} direction={'row'}>
          <Button
            rounded={'full'}
            px={6}
            colorScheme={'orange'}
            bg={'#81e6d9'}
            _hover={{ bg: 'orange.500' }}
            onClick={() => {
              Router.push('/chatbot/vip');
            }}
          >
            Register VIP
          </Button>
        </Stack>
        <Flex w={'full'}>
          <Image src="/chatbot.png" width="100%" height="100%" />
        </Flex>
      </Stack>
    </Container>
  );
}
