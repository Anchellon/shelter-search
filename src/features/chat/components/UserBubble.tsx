interface Props {
  content: string;
}

export default function UserBubble({ content }: Props) {
  return (
    <div className="flex justify-end">
      <div className="bg-brand-verylight border border-brand-light rounded-[12px_12px_2px_12px] px-4 py-3 max-w-[75%] text-sm text-grey-9 leading-relaxed">
        {content}
      </div>
    </div>
  );
}
