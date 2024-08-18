import { useCallback, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { PlaidLinkOnSuccess, PlaidLinkOptions, usePlaidLink } from 'react-plaid-link';
import { useRouter } from "next/navigation";
import { createLinkToken } from "@/lib/actions/user.actions";

const PlaidLink = ({ user, variant }: PlaidLinkProps) => {
	const [token, setToken] = useState('');
	const router = useRouter();

	//Creating a token to connect current user to a Plaid user
	useEffect(() => {
		const getLinkToken = async () => {
			const data = await createLinkToken(user);
			setToken(data?.linkToken);
		}
	}, [user]);

	const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token: string) => {
		/*await exchangePublicToken({
			publicToken: public_token,
			user
		})*/

		router.push("/"); //if token created & connection established, then redirecting user go home
	}, [user]); //callback func. called only when the user is changed

	//config object for Plaid Link
	const config: PlaidLinkOptions = {
		token,
		onSuccess
	}

	const { open, ready } = usePlaidLink(config);

	return (
		<>
			{variant === "primary" ? (
				<Button
					onClick={() => open()}
					disabled={!ready}
					className="plaidlink-primary"
				>
					Connect Bank
				</Button>
			) : variant === 'ghost' ? (
				<Button>
					Connect Bank
				</Button>
			) : (
				<Button>
					Connect Bank
				</Button>
			)}
		</>
	)
}

export default PlaidLink