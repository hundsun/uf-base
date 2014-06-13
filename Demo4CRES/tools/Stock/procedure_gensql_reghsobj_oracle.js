/************************************************************
   *** SQLfile  : 无
   *** Author   : qinyuan
   *** Date     : 2013-08-02
   *** Notes    : 过程注册信息
   *			  过程代码生成后，进行资源注册
  ************************************************************/

/***********************************************************************************************************************************************
   修订时间   修订版本    修改单    修改人    申请人      修改内容      修改原因          备注 

************************************************************************************************************************************************/


function main(/*Map<String, Object>*/ context) {
 
}
 
 //过程代码生成完成后，需要另外生成的代码，目前主要是资源信息注册
 function genCodeEnd(/*Map<String, Object>*/ context) {
 
	 var ret =  stringutil.getStringBuffer();
	 ret.append("-- 资源注册 -- \n");
	//数据库用户
	 var dbuser = context.get("dbuser");
	 if(dbuser != "") {
		 dbuser = dbuser + ".";
	 }
	 //过程模型
	 /*Procedure*/ 
	 procedure = context.get("procedure");
	 
	 ret.append("begin");
	 ret.append("\n");
	 ret.append("\tDELETE ");
	 ret.append(dbuser);
	 ret.append("hsobjects WHERE object_name = '" + procedure.getName() + "' AND object_type = 'P';");
	 ret.append("\n");
	 ret.append("\tINSERT into " + dbuser + "hsobjects (\n");
	 ret.append("\t\tobject_id,          object_name,        own_base,           object_type,\n");
     ret.append("\t\tmaster_ver,         second_ver,         third_ver,          build_ver,          business_prop)\n");
	 ret.append("\tvalues (");
	 ret.append("\n");
	 ret.append("\t\t" + procedure.getObjectId() + ",\t'" 
			 			+ procedure.getName() + "',\t'" 
			 			+ procedure.getDatabase() + "',\t'P',\n");
	 ret.append("\t\t8,\t0,\t0,\t0,\t' ');");
	 ret.append("\r\n");
	 ret.append("end;\n");
	 ret.append("/\n");
	 ret.append("\n");
	 ret.append("begin\n");
	 ret.append("\tcommit;\n");
	 ret.append("end;\n");
	 ret.append("/\n");
	 
	 return ret;
 }