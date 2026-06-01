'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Renderiza el manual (markdown) con estilos limpios, sin depender del plugin typography.
export default function ManualView({ content }: { content: string }) {
  return (
    <article className="text-slate-700 text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-900 mt-2 mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold text-slate-900 mt-8 mb-2 pb-1 border-b border-slate-200">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-slate-900 mt-5 mb-1">{children}</h3>,
          p: ({ children }) => <p className="my-2">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
          a: ({ href, children }) => <a href={href} className="text-blue-600 hover:underline">{children}</a>,
          code: ({ children }) => <code className="bg-slate-100 text-slate-800 rounded px-1.5 py-0.5 text-[0.8em] font-mono">{children}</code>,
          pre: ({ children }) => <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 my-3 overflow-x-auto text-xs">{children}</pre>,
          blockquote: ({ children }) => <blockquote className="border-l-4 border-slate-300 bg-slate-50 pl-4 py-1 my-3 text-slate-600">{children}</blockquote>,
          hr: () => <hr className="my-6 border-slate-200" />,
          table: ({ children }) => <div className="my-3 overflow-x-auto"><table className="w-full text-sm border border-slate-200 rounded-lg">{children}</table></div>,
          thead: ({ children }) => <thead className="bg-slate-50 text-slate-600">{children}</thead>,
          th: ({ children }) => <th className="text-left px-3 py-2 border-b border-slate-200 font-medium">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 border-b border-slate-100 align-top">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
