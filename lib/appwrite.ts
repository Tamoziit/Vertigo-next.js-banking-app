"use server";

import { Client, Account, Databases, Users } from "node-appwrite";
import { cookies } from "next/headers";

export async function createSessionClient() {
  //setting up or linking Appwrite project to set up a client --> regular user
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

  const session = cookies().get("appwrite-session"); //creating a session
  if (!session || !session.value) {
    throw new Error("No session");
  }

  client.setSession(session.value); //If session is active then attaching the client to the session

  return {
    get account() {
      return new Account(client);
    },
  };
}

export async function createAdminClient() {
  //Setting up Admin Client --> has access to all functionalities [auth, dbs, storage, etc...] (master client or API controller)
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
    .setKey(process.env.NEXT_APPWRITE_KEY!);

  return {
    get account() {
      return new Account(client);
    },
    get database() {
      return new Databases(client);
    },
    get user() {
      return new Users(client);
    }
  };
}
