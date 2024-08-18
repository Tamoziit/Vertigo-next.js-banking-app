'use server';

import { ID } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { encryptId, parseStringify } from "../utils";
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid";
import { plaidClient } from "@/lib/plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource } from "./dwolla.actions";

//destructuring env variables
const {
    APPWRITE_DATABASE_ID: DATABASE_ID,
    APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
    APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID
} = process.env;

export const signIn = async ({ email, password }: signInProps) => {
    try {
        const { account } = await createAdminClient();
        const response = await account.createEmailPasswordSession(email, password); //creating an authorized session

        return parseStringify(response);
    } catch (error) {
        console.error("Error", error);
    }
}

export const signUp = async (userData: SignUpParams) => {
    const { email, password, firstName, lastName } = userData; //destructuring
    try {
        const { account } = await createAdminClient();

        const newUserAccount = await account.create(
            ID.unique(),
            email,
            password,
            `${firstName} ${lastName}`
        );
        const session = await account.createEmailPasswordSession(email, password);

        cookies().set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: true,
        });

        return parseStringify(newUserAccount);
    } catch (error) {
        console.error("Error", error);
    }
}

export async function getLoggedInUser() { //logged in user
    try {
        const { account } = await createSessionClient();
        const user = await account.get();

        return parseStringify(user);
    } catch (error) {
        return null;
    }
}

export const logoutAccount = async () => {
    try {
        const { account } = await createSessionClient();
        cookies().delete('appwrite-session'); //deleting cookie of the logged in user

        await account.deleteSession('curernt');
    } catch (error) {
        return null;
    }
}

export const createLinkToken = async (user: User) => {
    try {
        const tokenParams = {
            user: {
                client_user_id: user.$id
            },
            client_name: user.name,
            products: ['auth'] as Products[],
            language: 'en',
            country_codes: ['US'] as CountryCode[],
        }

        const response = await plaidClient.linkTokenCreate(tokenParams); //creating plaid client token
        return parseStringify({ linkToken: response.data.link_token });
    } catch (error) {
        console.log(error);
    }
}

//creating a bank acc. as a document within the appwrite DB
export const createBankAccount = async ({
    userId,
    bankId,
    accountId,
    accessToken,
    fundingSourceUrl,
    sharableId
}: createBankAccountProps) => {
    try {
        const { database } = await createAdminClient();

        const bankAccount = await database.createDocument(
            DATABASE_ID!,
            BANK_COLLECTION_ID!,
            ID.unique(),
            {
                userId,
                bankId,
                accountId,
                accessToken,
                fundingSourceUrl,
                sharableId
            }
        );

        return parseStringify(bankAccount);
    } catch (error) {
        console.log("Error in creating Bank Account: ", error);
    }
}

//exchanges our existing public token with a token which allows us to carry out different banking tasks or services via Plaid --> Handshake model
export const exchangePublicToken = async ({
    publicToken,
    user
}: exchangePublicTokenProps) => {
    try {
        //exchange public token for access and item ID
        const response = await plaidClient.itemPublicTokenExchange({
            public_token: publicToken
        });

        //getting the Plaid access token in exchange of the prev. public token
        const accessToken = response.data.access_token;
        const itemId = response.data.item_id;

        //getting acc. info from Plaid using the access token
        const accountsResponse = await plaidClient.accountsGet({
            access_token: accessToken
        });
        const accountData = accountsResponse.data.accounts[0];

        //Creating a processor token for Dwolla using the access token & acc Id. Dwolla --> A payment processing gateway
        const request: ProcessorTokenCreateRequest = {
            access_token: accessToken,
            account_id: accountData.account_id,
            processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum
        };
        const processorTokenResponse = await plaidClient.processorTokenCreate(request);
        const processorToken = processorTokenResponse.data.processor_token; //extracting the token from the response

        //creating a funding source URL for the account using the Dwolla customer ID, processor Token, & bank name --> more simply connecting the payment process to bank, in order to send & receive funds.
        const fundingSourceUrl = await addFundingSource({
            dwollaCustomerId: user.dwollaCustomerId,
            processorToken,
            bankName: accountData.name
        });
        if (!fundingSourceUrl) throw Error;

        //Creating a bank acc.
        await createBankAccount({
            userId: user.$id,
            bankId: itemId,
            accountId: accountData.account_id,
            accessToken,
            fundingSourceUrl,
            sharableId: encryptId(accountData.account_id)
        });

        //revalidate the path to reflect the changes on the home page
        revalidatePath("/");

        return parseStringify({
            publicTokenExchange: "complete"
        });
    } catch (error) {
        console.log("Error in creating Public Token: ", error);
    }
}