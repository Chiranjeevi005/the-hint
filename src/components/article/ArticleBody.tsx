/**
 * ArticleBody Component
 * 
 * Renders the main article content from Markdown.
 * Optimized for long-form reading with clean typography.
 * 
 * NO business logic, NO imports from lib/content.
 */

import { marked } from 'marked';

interface ArticleBodyProps {
    content: string;
}

export function ArticleBody({ content }: ArticleBodyProps) {
    // Parse Markdown to HTML
    const htmlContent = marked.parse(content, {
        async: false,
        gfm: true,
        breaks: false,
    }) as string;

    return (
        <div className="mb-12">
            <div
                className="prose prose-lg max-w-none
                    prose-headings:font-bold prose-headings:leading-tight
                    prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
                    prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                    prose-p:text-lg prose-p:leading-relaxed prose-p:mb-6
                    prose-ul:my-6 prose-ul:pl-6
                    prose-li:text-lg prose-li:leading-relaxed prose-li:mb-2
                    prose-strong:font-bold
                    prose-img:block prose-img:w-full prose-img:mx-auto prose-img:my-8 prose-img:rounded-none
                    prose-blockquote:border-l-4 prose-blockquote:border-current prose-blockquote:pl-6 prose-blockquote:italic"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
        </div>
    );
}
