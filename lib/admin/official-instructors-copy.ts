import type { Locale } from "@/lib/i18n/config";
import { resolveAdminCopy } from "@/lib/admin/institutional-admin-copy";

const baseDictionaries = {
  en: {
    title: "Official IKA instructors",
    intro: "Manage the public official instructors directory here. Only the super admin can add, edit, hide, or delete records.",
    loginFirst: "Sign in to the admin first to manage instructors.",
    name: "Name",
    grade: "Grade",
    country: "Country of origin",
    chiefNote: "Chief instructor note",
    order: "Order",
    visible: "Visible",
    chiefInstructor: "Chief instructor label",
    chiefBadge: "IKA Chief Instructor",
    yes: "Yes",
    no: "No",
    photo: "Photo",
    photoAlt: "Photo alt text",
    previewAlt: "Instructor photo",
    noPhoto: "No photo",
    uploadPhoto: "Upload photo",
    changePhoto: "Change photo",
    removePhoto: "Remove photo",
    saveChanges: "Save changes",
    create: "Create instructor",
    reset: "Reset",
    listTitle: "Current list",
    loading: "Loading instructors...",
    empty: "There are no instructors yet.",
    edit: "Edit",
    delete: "Delete",
    published: "Published",
    hidden: "Hidden",
    required: "Name and country of origin are required.",
    created: "Instructor created.",
    updated: "Instructor updated.",
    deleted: "Instructor deleted.",
    selectImage: "Select a valid image.",
    language: "Language",
    translateChiefNote: "Translate note from Spanish",
    translateChiefNoteHelp: "Write the Chief Instructor note in Spanish first. This button will generate the rest of the languages automatically.",
    chiefNoteNeedsSpanish: "Please write the Chief Instructor note in Spanish first.",
    chiefNoteTranslationReady: "Chief Instructor note translations generated. Now save the changes.",
    chiefNoteTranslationFailed: "Could not translate the Chief Instructor note.",
  },
  es: {
    title: "Instructores oficiales IKA",
    intro: "Gestiona desde aqu\u00ed el listado p\u00fablico de instructores oficiales. Solo el super admin puede a\u00f1adir, editar, ocultar o eliminar fichas.",
    loginFirst: "Entra primero en el admin para gestionar instructores.",
    name: "Nombre",
    grade: "Grado",
    country: "Pa\u00eds de origen",
    chiefNote: "Nota institucional del chief instructor",
    order: "Orden",
    visible: "Visible",
    chiefInstructor: "Etiqueta chief instructor",
    chiefBadge: "IKA Chief Instructor",
    yes: "S\u00ed",
    no: "No",
    photo: "Foto",
    photoAlt: "Texto alternativo de la foto",
    previewAlt: "Foto del instructor",
    noPhoto: "Sin foto",
    uploadPhoto: "Subir foto",
    changePhoto: "Cambiar foto",
    removePhoto: "Quitar foto",
    saveChanges: "Guardar cambios",
    create: "Crear instructor",
    reset: "Limpiar",
    listTitle: "Listado actual",
    loading: "Cargando instructores...",
    empty: "Todav\u00eda no hay instructores cargados.",
    edit: "Editar",
    delete: "Eliminar",
    published: "Publicado",
    hidden: "Oculto",
    required: "Nombre y pa\u00eds de origen son obligatorios.",
    created: "Instructor creado.",
    updated: "Instructor actualizado.",
    deleted: "Instructor eliminado.",
    selectImage: "Selecciona una imagen v\u00e1lida.",
    language: "Idioma",
    translateChiefNote: "Traducir nota desde espa\u00f1ol",
    translateChiefNoteHelp: "Escribe primero la nota del Chief Instructor en espa\u00f1ol. Este bot\u00f3n generar\u00e1 autom\u00e1ticamente el resto de idiomas.",
    chiefNoteNeedsSpanish: "Primero escribe la nota del Chief Instructor en espa\u00f1ol.",
    chiefNoteTranslationReady: "Traducciones de la nota generadas. Ahora solo falta guardar los cambios.",
    chiefNoteTranslationFailed: "No se pudo traducir la nota del Chief Instructor.",
  },
} satisfies Partial<Record<Locale, Record<string, string>>>;

export function getOfficialInstructorsAdminCopy(locale: Locale) {
  return resolveAdminCopy(locale, baseDictionaries);
}

export function getChiefInstructorCopy(locale: Locale) {
  if (locale === "es") {
    return {
      label: "Etiqueta chief instructor",
      badge: "IKA Chief Instructor",
    };
  }

  return {
    label: "Chief instructor label",
    badge: "IKA Chief Instructor",
  };
}
