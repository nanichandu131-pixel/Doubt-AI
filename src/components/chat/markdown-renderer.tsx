import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';

const components: Components = {
  a: ({ className, ...props }) => (
    <a
      className={cn('font-medium text-primary underline underline-offset-3 hover:text-primary/80', className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre className={cn('overflow-x-auto rounded-lg p-3 text-sm', className)} {...props} />
  ),
  code: ({ className, ...props }) => {
    const isBlock = /language-/.test(className ?? '');
    return (
      <code
        className={cn(!isBlock && 'rounded bg-muted px-1 py-0.5 text-[0.85em]', className)}
        {...props}
      />
    );
  },
  ul: ({ className, ...props }) => <ul className={cn('list-disc pl-5', className)} {...props} />,
  ol: ({ className, ...props }) => <ol className={cn('list-decimal pl-5', className)} {...props} />,
  table: ({ className, ...props }) => (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  ),
  th: ({ className, ...props }) => <th className={cn('border px-3 py-1.5 text-left font-medium', className)} {...props} />,
  td: ({ className, ...props }) => <td className={cn('border px-3 py-1.5', className)} {...props} />,
};

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_pre_code]:bg-transparent [&_pre_code]:p-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
