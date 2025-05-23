import { Provider } from "@/components/ui/provider"
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "NinetyNinety - Elite Movie Discovery",
	description:
		"Discover the absolute best films with both 90%+ critics and audience scores",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark" style={{ colorScheme: "dark" }}>
			<body className={inter.className}>
				<Provider>{children}</Provider>
			</body>
		</html>
	);
}
