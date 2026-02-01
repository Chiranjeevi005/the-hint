/**
 * ArticleBody Component
 * 
 * Renders the main article content from Markdown.
 * Optimized for long-form reading with clean typography.
 * 
 * NO business logic, NO imports from lib/content.
 */

import { marked } from 'marked';
import { parseBodyToBlocks } from '@/lib/content/block-parser';
import { ImageBlockRenderer } from './ImageBlock';
import { VideoBlockRenderer } from './VideoBlock';
import {
    isImageBlock,
    isVideoBlock,
    isParagraphBlock,
    isSubheadingBlock,
    isQuoteBlock
} from '@/lib/content/media-types';

interface ArticleBodyProps {
    content: string;
}

export function ArticleBody({ content }: ArticleBodyProps) {
    // Parse content into blocks
    const { blocks } = parseBodyToBlocks(content);

    return (
        <div className="mb-12">
            <div className="prose prose-lg max-w-[680px] mx-auto font-serif
                    prose-headings:font-bold prose-headings:leading-tight prose-headings:font-sans
                    prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
                    prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                    prose-p:text-[1.125rem] prose-p:leading-[1.75] prose-p:mb-6 prose-p:text-[#111]
                    prose-a:no-underline prose-a:border-b prose-a:border-[#D9D9D9] prose-a:transition-colors prose-a:hover:border-[#111] prose-a:hover:text-[#000]
                    prose-ul:my-6 prose-ul:pl-6
                    prose-li:text-lg prose-li:leading-relaxed prose-li:mb-2
                    prose-strong:font-bold
                    prose-img:block prose-img:w-full prose-img:mx-auto prose-img:my-8 prose-img:rounded-sm
                    prose-blockquote:border-l-2 prose-blockquote:border-[#111] prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-[#444]">

                {blocks.map((block, index) => {
                    // Image Block
                    if (isImageBlock(block)) {
                        return (
                            <div key={block.id} className="not-prose my-8">
                                <ImageBlockRenderer
                                    block={block}
                                    isAboveFold={index < 2}
                                />
                            </div>
                        );
                    }

                    // Video Block
                    if (isVideoBlock(block)) {
                        return (
                            <div key={block.id} className="not-prose my-8">
                                <VideoBlockRenderer block={block} />
                            </div>
                        );
                    }

                    // Subheading
                    if (isSubheadingBlock(block)) {
                        return (
                            <h2 key={block.id}>{block.content}</h2>
                        );
                    }

                    // Quote
                    if (isQuoteBlock(block)) {
                        return (
                            <blockquote key={block.id}>
                                <p>{block.content}</p>
                                {block.attribution && (
                                    <footer>— {block.attribution}</footer>
                                )}
                            </blockquote>
                        );
                    }

                    // Paragraph (Default)
                    // Render markdown content
                    const htmlContent = marked.parse(block.content, {
                        async: false,
                        gfm: true,
                        breaks: false,
                    }) as string;

                    return (
                        <div
                            key={block.id}
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
