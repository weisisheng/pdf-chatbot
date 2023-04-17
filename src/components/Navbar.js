import Link from "next/link";

const Navbar = ({ apiKey, setApiKey }) => {
    return (
        <div className="flex flex-col gap-1 border-b-2 border-b-[#eb9722] bg-zinc-900">
            <div className="flex flex-row items-center justify-between px-3 py-4">
                <Link href="/" className="ml-4 text-xl text-[#eb9722] hover:opacity-80">
                    PDF ChatBot
                </Link>
                <input
                    autoFocus={false}
                    rows={1}
                    type="password"
                    id="apiKey"
                    name="apiKey"
                    placeholder="Enter your OpenAI API key here"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="ml-4 hidden h-11 w-2/4 max-w-xl resize-none rounded border-zinc-800 bg-zinc-200 p-4 text-lg text-zinc-900 outline-none md:flex"
                />
                <div className="mr-4 flex flex-row justify-end">
                    <Link
                        href="https://github.com/nathanclairmonte/pdf-chatbot"
                        className="text-xl text-[#eb9722] hover:opacity-80"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Repo
                    </Link>
                </div>
            </div>
            <div className="flex flex-row justify-center px-4 pb-4 md:hidden">
                <input
                    autoFocus={false}
                    rows={1}
                    type="password"
                    id="apiKey"
                    name="apiKey"
                    placeholder="Enter your OpenAI API key here"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="h-11 w-2/4 max-w-xl flex-grow resize-none rounded border-zinc-800 bg-zinc-200 p-4 text-lg text-zinc-900 outline-none"
                />
            </div>
        </div>
    );
};

export default Navbar;
