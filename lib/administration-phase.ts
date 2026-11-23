// Public account creation never grants administrative permissions, including
// when a previous deployment still carries the retired development setting.
export function openAdministrationRegistration(){
 return false;
}
