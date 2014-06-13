/************************************************************
 *** JSfile   : stdfld_genxml_common.js
 *** Author   : zhuyf
 *** Date     : 2013-5-6
 *** Notes    : 该用户脚本用于生成 标准字段XML文件（普通字段）
 ************************************************************/

	/**用户变量定义区，允许用户自行修改*/
	var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation");  //输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var charset = sys.getConfig("com.hundsun.ares.studio.preference.charset");  //默认选项值:编码方式。
	var userName = sys.get("user.name");//当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var notes =" 标准字段生成sql文件";//说明，默认选项值，可通过context.get方法获取用户选项值进行替换。

	/**
	 * 入口函数一般为外部调用
	 * 
	 * @param context
	 */
	function main(/*Map<Object, Object> */ context) {
		
		var xmlFileName = "user_fieldname_or.sql";	
		var file_path = fileOutputLocation + "/" + xmlFileName;	
		var xmlBuffer = stringutil.getStringBuffer();
		xmlBuffer.append(stringutil.getSQLFileHeader(xmlFileName,userName, calendar.format(calendar.now(),"yyyy-MM-dd"),notes));
		var stdfieldInfo = project.getMetadataInfoByType("stdfield");
		xmlBuffer.append(stdfieldInfo.getModifyHistory("--"));//获取用户常量修改记录，返回全部修改记录的文本
		xmlBuffer.append("\n\n");
		xmlBuffer.append("prompt Create fieldtoname InitValue ...\n\r\n");
		
		var stdItems = stdfieldInfo.getItems();
		input.getInput();//打开弹出用户选项界面，用户选项值直接写入context中
		if(context.get("genMode") ==  "install"){//获取指定生成方式，安装包模式
			xmlBuffer.append("begin \r\n");
			for(var i in stdItems){
				var stdItem = stdItems[i];
				var stdName = stdItem.getName();
				var stdCName = stdItem.getChineseName();
				var stdDict = stdItem.getDictInfo();
				if (stringutil.isNotBlank(stdName)) {
					xmlBuffer.append("  insert into hs_user.fieldtoname(english_name,dict_entry,entry_name)");
					xmlBuffer.append(" values ( \'" + stdName + "\',");
					xmlBuffer.append(stdDict == null ? 0 : stdDict.getName());
					xmlBuffer.append(", \'" + stdCName + "\');");
					xmlBuffer.append("\r\n");
				}
			}
		}else {//获取指定生成方式，非安装包模式
			for(var i in stdItems){
				var stdItem = stdItems[i];
				var stdName = stdItem.getName();
				var stdCName = stdItem.getChineseName();
				var stdDict = stdItem.getDictInfo();
				if (stringutil.isNotBlank(stdName)) {
					xmlBuffer.append("declare v_rowcount number(5);\r\n");
					xmlBuffer.append("begin \r\n");
					xmlBuffer.append("  select count(*) into v_rowcount from dual\r\n");
					xmlBuffer.append("    where exists (select 1 from hs_user.fieldtoname where english_name = \'" + stdName + "\');\r\n");
					xmlBuffer.append("  if v_rowcount = 0 then\r\n");
					xmlBuffer.append("    insert into hs_user.fieldtoname(english_name,dict_entry,entry_name) values ( \'" + stdName + "\', " + 
							(stdDict == null ? 0 : stdDict.getName()) + ", \'"
							+ stdCName + "\');\r\n");
					xmlBuffer.append("  else\r\n");
					xmlBuffer.append("    update hs_user.fieldtoname set entry_name = \'" + stdCName + "\',dict_entry = " + 
							(stdDict == null ? 0 : stdDict.getName()) + " where english_name = \'" +
							stdName+ "\';\r\n");
					xmlBuffer.append("  end if;\r\n");
					xmlBuffer.append("  commit;\r\n");
					xmlBuffer.append("end;\r\n/\r\n");
					xmlBuffer.append("\r\n");
				}
			}
			xmlBuffer.append("begin \r\n");
		}
		xmlBuffer.append("  commit;\r\n");
		xmlBuffer.append("end;\r\n");
		xmlBuffer.append("/");
		xmlBuffer.append("\r\n");
		
		
		file.write(file_path, xmlBuffer,charset);
		file_path = file.getAbsolutePath();
		output.dialog("成功生成标准字段文件，生成路径为：" + file_path);//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
		output.info("成功生成标准字段文件，生成路径为" + file_path);//信息输出，控制台输出信息。
	}