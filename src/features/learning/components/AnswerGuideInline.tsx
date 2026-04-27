"use client";

import { ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface AnswerGuideItem {
  question: string;
  bodyMarkdown?: string;
  exampleAnswers?: string[];
}

const GUIDE_METADATA_BREAK =
  /([^\n])\s+(\*\*(?:Useful language|Pattern to apply):\*\*|(?:Useful language|Pattern to apply):)/g;

function normalizeGuideMarkdown(content: string) {
  return content
    .replace(/\r\n?/g, "\n")
    .replace(GUIDE_METADATA_BREAK, "$1\n\n$2");
}

function MarkdownText({ content }: { content: string }) {
  const normalizedContent = normalizeGuideMarkdown(content);

  return (
    <div className="guide-markdown text-[15.5px] leading-7 text-gray-700 md:text-base">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 list-disc pl-5">{children}</ul>,
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-1.5">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}

export default function AnswerGuideInline({
  guides,
}: {
  guides: AnswerGuideItem[];
}) {
  if (!guides.length) return null;

  return (
    <details className="group/answer-section mb-2">
      <summary
        className="flex cursor-pointer items-center justify-between gap-3 [&_*]:cursor-pointer"
        title="Click to expand or collapse"
      >
        <span className="flex items-center gap-2">
          <ChevronRight
            size={14}
            className="shrink-0 text-indigo-500 transition-transform duration-200 group-open/answer-section:rotate-90"
          />
          <span>7) Questions & Practice Ideas</span>
        </span>
        <ChevronRight
          size={12}
          className="shrink-0 text-gray-400 transition-transform duration-200 group-open/answer-section:hidden"
        />
        <span className="hidden text-xs font-medium text-indigo-600 group-open/answer-section:inline">
          Collapse
        </span>
      </summary>

      <div className="space-y-2 px-2.5 py-2">
        {guides.map((guide, questionIndex) => (
          <details
            key={`${questionIndex}-${guide.question}`}
            className="group/answer-question overflow-hidden rounded-md border border-gray-200 bg-white/80"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-[15px] font-semibold leading-6 text-gray-900 transition-colors hover:bg-gray-50">
              <span className="flex items-center gap-2">
                <ChevronRight
                  size={13}
                  className="shrink-0 text-indigo-500 transition-transform duration-200 group-open/answer-question:rotate-90"
                />
                <span>
                  {questionIndex + 1}. {guide.question}
                </span>
              </span>
              <span className="text-[11px] font-medium text-indigo-600">
                {""}
              </span>
            </summary>

            <div className="space-y-3 border-t border-gray-200 px-3 py-3">
              {guide.bodyMarkdown ? (
                <MarkdownText content={guide.bodyMarkdown} />
              ) : (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                    Sample answers
                  </p>
                  {(guide.exampleAnswers ?? []).map((answer, answerIndex) => (
                    <div
                      key={`${answerIndex}-${answer.slice(0, 20)}`}
                      className="rounded-md border border-gray-200 bg-white px-2.5 py-2"
                    >
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Version {answerIndex + 1}
                      </p>
                      <MarkdownText content={answer} />
                    </div>
                  ))}
                </>
              )}
            </div>
          </details>
        ))}
      </div>
    </details>
  );
}
