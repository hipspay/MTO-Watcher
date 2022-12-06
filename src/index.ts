import { config } from 'dotenv';
config();

import escrowABI from './constants/escrowABI.json';
import Web3 from 'web3';
import { EventData } from 'web3-eth-contract';
const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS;
console.log(contractAddress, 'contract address');
const web3 = new Web3(process.env.ALCHEMY_URL);
import OrderService from './services/OrderService';
const orderService = new OrderService();

import DisputeService from './services/DisputeService';
const disputeService = new DisputeService();

import AgentService from './services/AgentService';
const agentService = new AgentService();

import { connect } from './typeorm';
import { Connection } from 'typeorm';

import {
    AgentStatus,
    DisputeStatus,
} from './shared/constants/global.constants';
let connection: Connection = null;
connect().then(async (result) => {
    connection = result;
    console.log('DB is connected');

    await initContract(escrowABI, contractAddress);
    console.log('initContract');
});

interface IResult {
    [key: string]: any;
}

console.log('Eth Node Version: ', web3.version);
console.log('Network: ', web3.version);

const handleError = (e) => {
    console.log('handleError', e);
    return undefined;
};
const initContract = async (contractAbi, contractAddress) => {
    const contractInstance = new web3.eth.Contract(
        contractAbi,
        contractAddress
    );

    // const [
    //     dispute
    // ] = await Promise.all([
    //     contractInstance.methods
    //         .disputes(5)
    //         .call()
    //         .catch(handleError)
    // ]);

    // console.log('dispute', dispute);

    contractInstance.events.allEvents(async (_: any, data: EventData) => {
        console.log('allEvents', data);
        if (data?.event === 'Escrowed') {
            const eventValues: IResult = data.returnValues;
            const { _from } = eventValues;
            let { _productID, _escrowId } = eventValues;
            _productID = parseInt(_productID);
            _escrowId = parseInt(_escrowId);

            const escrowResult = await contractInstance.methods
                .escrows(_escrowId)
                .call();
            const { escrowDisputableTime, escrowWithdrawableTime } =
                escrowResult;

            const dbResult = await orderService.handleEscrow(
                _from,
                _productID,
                escrowDisputableTime,
                escrowWithdrawableTime,
                _escrowId
            );

            console.log('Escrow Event');
        }
        if (data?.event === 'Disputed') {
            const eventValues: IResult = data.returnValues;

            const { _from } = eventValues;
            let { _disputeId, _escrowId } = eventValues;
            _disputeId = parseInt(_disputeId);
            _escrowId = parseInt(_escrowId);

            const [
                disputeResult,
                disputeReviewGroupCount,
                disputeReviewConsensusCount,
            ] = await Promise.all([
                contractInstance.methods
                    .disputes(_disputeId)
                    .call()
                    .catch(handleError),
                contractInstance.methods
                    .disputeReviewGroupCount()
                    .call()
                    .catch(handleError),
                contractInstance.methods
                    .disputeReviewConsensusCount()
                    .call()
                    .catch(handleError),
            ]);
            // const disputeResult = await contractInstance.methods
            //     .disputes(_disputeId)
            //     .call();
            const { approvedCount, disapprovedCount } = disputeResult;

            const dbResult = await disputeService.handleDispute(
                _from,
                approvedCount,
                disapprovedCount,
                _escrowId,
                _disputeId,
                disputeReviewGroupCount,
                disputeReviewConsensusCount
            );

            console.log('Dispute Event');
        }
        if (data?.event === 'Withdraw') {
            const eventValues: IResult = data.returnValues;
            let { _escrowId } = eventValues;
            _escrowId = parseInt(_escrowId);
            const escrowResult = await contractInstance.methods
                .escrows(_escrowId)
                .call();
            const { productId } = escrowResult;

            const dbResult = await orderService.handleWithdraw(
                _escrowId,
                productId
            );

            console.log('Withdraw Event');
        }
        if (data?.event === 'AgentParticipated') {
            try {
                const eventValues: IResult = data.returnValues;
                console.log(eventValues);

                const { _agentAddress } = eventValues;

                await agentService.updateAgent({
                    walletAddress: _agentAddress,
                    status: AgentStatus.WAITING,
                });

                console.log('AgentParticipated Event');
            } catch (error) {
                console.log(error);
            }
        }
        if (data?.event === 'AssignAgent') {
            try {
                const eventValues: IResult = data.returnValues;
                console.log(eventValues);

                const { _agentAddress, _disputeId } = eventValues;

                await agentService.updateAgent({
                    walletAddress: _agentAddress,
                    disputeId: _disputeId,
                    status: AgentStatus.REVIEW,
                });

                await disputeService.handleAssignment(parseInt(_disputeId));

                console.log('AssignAgent Event');
            } catch (error) {
                console.log(error);
            }
        }

        if (data?.event === 'SubmittedDispute') {
            try {
                const eventValues: IResult = data.returnValues;
                console.log(eventValues);

                const { _agentAddress, _disputeId, _decision } = eventValues;

                await agentService.updateAgent({
                    walletAddress: _agentAddress,
                    disputeId: _disputeId,
                    status:
                        _decision === '4'
                            ? AgentStatus.PENDING_01
                            : AgentStatus.PENDING_02,
                });

                await disputeService.handleSubmission(
                    _disputeId,
                    _decision,
                    connection
                );

                console.log('SubmittedDispute Event');
            } catch (error) {
                console.log(error);
            }
        }
        if (
            data?.event === 'DisputeApproved' ||
            data?.event === 'DisputeDisapproved'
        ) {
            try {
                const eventValues: IResult = data.returnValues;
                console.log(eventValues);

                const { _disputeId } = eventValues;

                await agentService.processDisputeCompletion(
                    parseInt(_disputeId),
                    contractInstance
                );

                await disputeService.handleCompletion(
                    parseInt(_disputeId),
                    data.event === 'DisputeApproved'
                        ? DisputeStatus.WIN
                        : DisputeStatus.FAIL
                );

                console.log('DisputeApproved OR DisputeDisapproved Event');
            } catch (error) {
                console.log(error);
            }
        }

        if (data?.event === 'AgentWithdraw') {
            try {
                const eventValues: IResult = data.returnValues;
                console.log(eventValues);

                const { _withdrawer } = eventValues;

                await agentService.processWithdraw(_withdrawer);

                console.log('AgentWithdraw Event');
            } catch (error) {
                console.log(error);
            }
        }
    });
};
