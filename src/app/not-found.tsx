import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h2 className="font-serif text-3xl font-bold mb-4 text-[#111]">Page not found</h2>
            <p className="font-sans text-base text-[#595959] mb-8 max-w-md">
                We wouldn't want you to be lost.
            </p>
            <Link
                href="/"
                className="font-sans text-xs font-bold uppercase tracking-widest border-b border-[#111] pb-1 hover:text-[#595959] hover:border-[#595959] transition-colors"
            >
                Return to the Home Page
            </Link>
        </div>
    );
}
