export const LabeledSeparator = ({ label }: { label: string }) => {
  return (
    <div className="flex items-center my-2">
      <div className="flex-1 border-t border-gray-300"></div>
      <span className="px-4 text-gray-500 text-sm">{label}</span>
      <div className="flex-1 border-t border-gray-300"></div>
    </div>
  );
};
