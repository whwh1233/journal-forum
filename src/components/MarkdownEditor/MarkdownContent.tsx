import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  return (
    <>
      <div className={`markdown-content ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeSanitize]}
          components={{
            img: ({ src, alt, ...props }) => (
              <img
                src={src}
                alt={alt || 'image'}
                {...props}
                style={{ maxWidth: '100%', cursor: 'pointer', borderRadius: '4px' }}
                onClick={() => src && setLightboxSrc(src)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.insertAdjacentHTML('afterend',
                    '<span class="markdown-img-error">图片加载失败</span>');
                }}
                loading="lazy"
              />
            )
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {lightboxSrc && (
        <div
          className="markdown-lightbox"
          onClick={() => setLightboxSrc(null)}
        >
          <img src={lightboxSrc} alt="enlarged" />
        </div>
      )}
    </>
  );
};

export default MarkdownContent;
