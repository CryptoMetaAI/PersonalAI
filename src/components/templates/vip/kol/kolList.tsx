import {
  Button,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Tfoot,
  Heading,
  Box,
  HStack,
  useColorModeValue,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Tooltip,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { getEllipsisTxt } from 'utils/format';
import vipABI from './vip.json';
import lensHubABI from './lensHub.json';
import { useWeb3React } from '@web3-react/core';
import { marketHelperAddr } from 'utils/config';
import { isEmptyObj } from 'utils/utils';
import { useRouter } from 'next/router';
import { getImageInfo } from 'utils/resolveIPFS';
import BigNumber from 'bignumber.js';

const KOLList: FC = () => {
  const { account, library: web3, chainId } = useWeb3React();

  const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [kolList, setKolList] = useState<any[]>([]);
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isComfirming, setIsComfirming] = useState<boolean>(false);
  const [lensHub, setLensHub] = useState<any>(null);
  const [nftImage, setNFTImage] = useState<string>('');
  const [amount, setAmount] = useState<number>(1);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [marketHelper, setMarketHelper] = useState<any>(null);
  const [vipContract, setVipContract] = useState(null);
  const [discountRate, setDiscountRate] = useState(0);
  const [kolProfileId, setKolProfileId] = useState(0);
  const [maxMonths, setMaxMonths] = useState(0);
  const [addedAmount, setAddedAmount] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState(0);

  const toast = useToast();
  const router = useRouter();

  const initialRef = React.useRef(null);
  const finalRef = React.useRef(null);

  const contractAddr = {
    137: {
      vipAddr: '',
      lensHubAddr: '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d',
    },
    80001: {
      vipAddr: '0x3d1a3Fe1c3D313b6c78fB5137496E48724733C44',
      lensHubAddr: '0x6346fAF83b9Eaaa8E34d5428f3294AC53B6bF50E',
    },
  };

  useEffect(() => {
    if (!isEmptyObj(web3)) {
      const vipAddr = contractAddr[chainId].vipAddr;
      const vipContractObj = new web3.eth.Contract(vipABI, vipAddr);
      setVipContract(vipContractObj);

      const lensHubAddr = contractAddr[chainId].lensHubAddr;
      const lensHubContract = new web3.eth.Contract(lensHubABI, lensHubAddr);
      setLensHub(lensHubContract);
    }
  }, [web3]);

  useEffect(() => {
    if (!isEmptyObj(vipContract)) {
      //getKols();
      setKolList([
        {
          profileId: 10000,
          discountRate: 5,
          maxMonths: 1,
          usedCount: 10,
          usedAmount: '1000000000000000000',
          totalAmount: '10000000000000000000',
        },
        {
          profileId: 10001,
          discountRate: 10,
          maxMonths: 3,
          usedCount: 11,
          usedAmount: '2000000000000000000',
          totalAmount: '20000000000000000000',
        },
        {
          profileId: 20001,
          discountRate: 8,
          maxMonths: 6,
          usedCount: 20,
          usedAmount: '3000000000000000000',
          totalAmount: '30000000000000000000',
        },
      ]);
    }
  }, [vipContract]);

  const getKols = () => {
    let totalLength = 0;
    vipContract.methods['getKolLength']()
      .call({ from: account })
      .then((length: number) => {
        totalLength = length;
        vipContract.methods['getKols'](0, length)
          .call({ from: account })
          .then((kolList: any[]) => {
            console.log(kolList);
            const cooperationModeList = [];
            for (let i = 0; i < kolList.length; i++) {
              vipContract.methods['kolCooperationModeMap'](kolList[i])
                .call({ from: account })
                .then((cooperationMode: any[]) => {
                  cooperationMode.profileId = kolList[i];
                  cooperationModeList.push(cooperationMode);
                  if (cooperationModeList.length == kolList.length) {
                    setKolList(cooperationModeList);
                  }
                });
            }
          });
      });
  };

  const buy = (orderId: number, amount: number, value: string, bComfirm: boolean) => {
    const contractFunc = market.methods['buy'];
    const data = contractFunc(orderId, amount).encodeABI();

    const tx = {
      from: account,
      to: market._address,
      data,
      value,
      gasLimit: 0,
    };
    console.log(tx);
    contractFunc(orderId, amount)
      .estimateGas({ from: account, value })
      .then((gasLimit: any) => {
        tx.gasLimit = gasLimit;
        web3.eth
          .sendTransaction(tx)
          .on('transactionHash', () => {
            bComfirm ? setIsComfirming(true) : setIsBuying(true);
          })
          .on('receipt', () => {
            bComfirm ? setIsComfirming(false) : setIsBuying(false);
          })
          .on('error', () => {
            bComfirm ? setIsComfirming(false) : setIsBuying(false);
            toast({
              title: 'Failed',
              description: 'Deposit DNFT failed',
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
      });
  };

  const adjustConfig = () => {
    const contractFunc = vipContract.methods['adjustConfigure'];
    const data = contractFunc(selectedProfileId, discountRate, maxMonths).encodeABI();
    const fee = '0x' + new BigNumber(addedAmount).shiftedBy(18).toString(16);
    const tx = {
      from: account,
      to: vipContract._address,
      data,
      value: fee,
      gasLimit: 0,
    };
    contractFunc(selectedProfileId, discountRate, maxMonths)
      .estimateGas({ from: account, value: fee })
      .then((gasLimit: any) => {
        tx.gasLimit = gasLimit;
        web3.eth
          .sendTransaction(tx)
          .on('transactionHash', () => {
            setIsComfirming(true);
          })
          .on('receipt', () => {
            setIsComfirming(false);
          })
          .on('error', () => {
            setIsComfirming(false);
            toast({
              title: 'Failed',
              description: 'Adjust configure failed',
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
      });
  };

  const followKOL = (profileId) => {
    const contractFunc = lensHub.methods['follow'];
    const data = contractFunc([profileId], ['']).encodeABI();
    const tx = {
      from: account,
      to: lensHub._address,
      data,
      value: 0,
      gasLimit: 0,
    };
    contractFunc([profileId], [''])
      .estimateGas({ from: account })
      .then((gasLimit: any) => {
        tx.gasLimit = gasLimit;
        web3.eth
          .sendTransaction(tx)
          .on('transactionHash', () => {
            setIsFollowing(true);
          })
          .on('receipt', () => {
            setIsFollowing(false);
          })
          .on('error', () => {
            setIsFollowing(false);
            toast({
              title: 'Failed',
              description: 'Follow KOL failed',
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
      });
  };

  /*
      uint256 discountRate;
        uint256 maxMonths;
        uint256 usedCount;
        uint256 usedAmount;
        uint256 totalAmount;
    */
  return (
    <>
      <Heading size="lg" marginBottom={6}>
        <HStack justifyContent="space-between">
          <div />
          <Tooltip
            label={
              'Issue your Fans NFT, it will transfer your NFT-721 to FansNFT contract, then an NFT-3525 belonged to you will be generated.'
            }
          >
            <Button colorScheme="teal" variant="outline" onClick={onOpen}>
              Register KOL
            </Button>
          </Tooltip>
        </HStack>
      </Heading>
      {kolList?.length ? (
        <Box border="2px" borderColor={hoverTrColor} borderRadius="xl" padding="24px 18px">
          <TableContainer w={'full'}>
            <Table className="table-tiny">
              <Thead>
                <Tr>
                  <Th>Profile Id</Th>
                  <Th>Discount Rate</Th>
                  <Th>Max Months</Th>
                  <Th>Used Count</Th>
                  <Th>Used Amount</Th>
                  <Th>Total Amount</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {kolList?.map((kolInfo, key) => (
                  <Tr key={`${kolInfo.profileId}-${key}-tr`} _hover={{ bgColor: hoverTrColor }}>
                    <Td>{kolInfo.profileId}</Td>
                    <Td>{kolInfo.discountRate}%</Td>
                    <Td>{kolInfo.maxMonths}</Td>
                    <Td>{kolInfo.usedCount}</Td>
                    <Td>{new BigNumber(kolInfo.usedAmount).shiftedBy(-18).toNumber()} Matic</Td>
                    <Td>{new BigNumber(kolInfo.totalAmount).shiftedBy(-18).toNumber()} Matic</Td>
                    <Td>
                      <Button
                        colorScheme="teal"
                        mr={3}
                        isLoading={isAdjusting}
                        loadingText={'Adjusting'}
                        onClick={() => {
                          setSelectedProfileId(kolInfo.profileId);
                          onOpen();
                        }}
                      >
                        Adjust Discount
                      </Button>
                      <Button
                        colorScheme="teal"
                        mr={3}
                        isLoading={isFollowing}
                        loadingText={'Following'}
                        onClick={() => {
                          followKOL(kolInfo.profileId);
                        }}
                      >
                        Follow
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
              <Tfoot></Tfoot>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        <Box>Looks like there is no KOL.</Box>
      )}
      <Modal initialFocusRef={initialRef} finalFocusRef={finalRef} isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Adjust Discount Info</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Profile Id</FormLabel>
              <Input
                ref={initialRef}
                value={kolProfileId}
                onChange={(e) => setKolProfileId(parseInt(e.target.value))}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Discount Rate</FormLabel>
              <Input
                ref={initialRef}
                value={discountRate}
                onChange={(e) => setDiscountRate(parseInt(e.target.value))}
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Max Months</FormLabel>
              <Input onChange={(e) => setMaxMonths(parseInt(e.target.value))} value={maxMonths} />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Added Amount (Matic)</FormLabel>
              <Input onChange={(e) => setAddedAmount(e.target.value)} value={addedAmount} />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => adjustConfig()}
              isLoading={isComfirming}
              loadingText="Buying"
            >
              Comfirm
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default KOLList;
