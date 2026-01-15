interface ArticlePageProps {
    params: Promise<{
        section: string;
        slug: string;
    }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
    const { section, slug } = await params;

    return (
        <main>
            <h1>Article: {section}/{slug}</h1>
        </main>
    );
}
