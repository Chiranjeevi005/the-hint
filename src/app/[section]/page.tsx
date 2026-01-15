interface SectionPageProps {
    params: Promise<{
        section: string;
    }>;
}

export default async function SectionPage({ params }: SectionPageProps) {
    const { section } = await params;

    return (
        <main>
            <h1>Section: {section}</h1>
        </main>
    );
}
