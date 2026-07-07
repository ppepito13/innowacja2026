import { useCallback, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  uploadImage?: (file: File) => Promise<string>;
}

const EMPTY_HTML = '<p><br></p>';

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  uploadImage,
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      const editor = quillRef.current?.getEditor();
      if (!file || !editor) return;

      const range = editor.getSelection(true);
      const index = range ? range.index : editor.getLength();

      if (!uploadImage) return;
      try {
        const url = await uploadImage(file);
        if (url) {
          editor.insertEmbed(index, 'image', url, 'user');
          editor.setSelection(index + 1, 0);
        }
      } catch {}
    };
    input.click();
  }, [uploadImage]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          ['bold', 'italic', 'underline', 'code-block'],
          [{ header: 1 }, { header: 2 }],
          ['blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          [{ indent: '-1' }, { indent: '+1' }],
          ['link', 'image'],
        ],
        handlers: { image: imageHandler },
      },
    }),
    [imageHandler],
  );

  return (
    <div className="rte">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={(html) => onChange(html === EMPTY_HTML ? '' : html)}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
}
